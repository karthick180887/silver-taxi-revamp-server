package cabigo.driver

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.net.URISyntaxException

class SocketForegroundService : Service() {

    private var socket: Socket? = null
    private var currentAuthToken: String? = null
    private val serviceScope = CoroutineScope(Dispatchers.Main)
    private val NOTIFICATION_ID = 1
    private val CHANNEL_ID = "socket_service_channel"
    private var tokenRetryScheduled = false
    private val gson = Gson()
    private val mapType = object : TypeToken<Map<String, Any?>>() {}.type

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        // Moved initSocket() to onStartCommand to ensure startForeground runs first
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)

        try {
            // Show foreground notification IMMEDIATELY
            val notification = createForegroundNotification()
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Explicitly declare type for Android 14+ compliance if possible
                // Using 1 for DATA_SYNC (value of FOREGROUND_SERVICE_TYPE_DATA_SYNC)
                // Use hardcoded integer or ServiceInfo constant if import available
                // android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC = 1
                startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }

            // Connect socket AFTER promoting to foreground
            if (socket == null) {
                initSocket()
            } else if (socket?.connected() == false) {
                socket?.connect()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            // If we fail, stop self to avoid ANR/Crash loop
            stopSelf()
        }

        return START_STICKY
    }

    private fun initSocket() {
        try {
            val authToken = getDriverAuthToken()
            if (authToken.isBlank()) {
                android.util.Log.w("SocketForegroundService", "No driver auth token yet; skipping socket connect and retrying shortly")
                scheduleTokenRetry()
                return
            }

            // If driver token changed (logout/login), reconnect with the new token
            if (currentAuthToken != null && currentAuthToken != authToken) {
                try {
                    socket?.disconnect()
                    socket = null
                } catch (e: Exception) {
                    android.util.Log.w("SocketForegroundService", "Error resetting socket for new token: ${e.message}")
                }
            }
            currentAuthToken = authToken

            // Options for socket.io-client 2.x
            val options = IO.Options()
            options.reconnection = true
            options.reconnectionDelay = 1000
            options.reconnectionDelayMax = 5000
            options.reconnectionAttempts = Integer.MAX_VALUE
            options.transports = arrayOf("websocket") // Force WebSocket
            options.query = "token=$authToken"

            socket = IO.socket("https://api.cabigo.in", options)

            socket?.on(Socket.EVENT_CONNECT) {
                try {
                    handleSocketConnected()
                } catch (e: Exception) {
                    android.util.Log.e("SocketForegroundService", "Error in connect handler: ${e.message}", e)
                }
            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                try {
                    handleSocketDisconnected()
                } catch (e: Exception) {
                    android.util.Log.e("SocketForegroundService", "Error in disconnect handler: ${e.message}", e)
                }
            }

            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                try {
                    android.util.Log.e("SocketForegroundService", "Socket connection error: ${args.contentToString()}")
                } catch (e: Exception) {
                    android.util.Log.e("SocketForegroundService", "Error handling connection error: ${e.message}", e)
                }
            }

            // Listen for notification events from backend
            socket?.on("notification") { args ->
                try {
                    handleNotificationEvent(args)
                } catch (e: Exception) {
                    android.util.Log.e("SocketForegroundService", "Error handling notification: ${e.message}", e)
                }
            }

            socket?.connect()
            android.util.Log.d("SocketForegroundService", "Socket connection initiated")

        } catch (e: URISyntaxException) {
            android.util.Log.e("SocketForegroundService", "URISyntaxException: ${e.message}", e)
        } catch (e: Exception) {
            android.util.Log.e("SocketForegroundService", "Error initializing socket: ${e.message}", e)
        }
    }

    private fun scheduleTokenRetry() {
        if (tokenRetryScheduled) return
        tokenRetryScheduled = true
        serviceScope.launch {
            try {
                kotlinx.coroutines.delay(5000)
            } finally {
                tokenRetryScheduled = false
            }
            // Try again (service is foreground; keep it light)
            if (socket == null || socket?.connected() == false) {
                initSocket()
            }
        }
    }

    private fun handleSocketConnected() {
        try {
            android.util.Log.d("SocketForegroundService", "Socket connected successfully")
            // Send device FCM token to backend
            val fcmToken = getFCMToken()
            val deviceId = generateDeviceId()
            
            if (fcmToken.isNotEmpty() && socket != null && socket!!.connected()) {
                socket?.emit("register_device", mapOf(
                    "fcmToken" to fcmToken,
                    "deviceId" to deviceId,
                    "timestamp" to System.currentTimeMillis()
                ))
                android.util.Log.d("SocketForegroundService", "Device registration sent")
            } else {
                android.util.Log.w("SocketForegroundService", "Cannot register device: token=${fcmToken.isNotEmpty()}, socket=${socket != null && socket!!.connected()}")
            }
        } catch (e: Exception) {
            android.util.Log.e("SocketForegroundService", "Error in handleSocketConnected: ${e.message}", e)
        }
    }

    private fun handleSocketDisconnected() {
        // Socket will auto-reconnect due to config
    }

    private fun handleNotificationEvent(args: Array<Any>) {
        try {
            if (args.isEmpty()) {
                android.util.Log.w("SocketForegroundService", "Notification event with empty args")
                return
            }

            val event = toMap(args[0])
            if (event == null) {
                android.util.Log.w("SocketForegroundService", "Notification data could not be parsed: ${args[0]::class.java.name}")
                return
            }

            val type = (event["type"] ?: event["Type"])?.toString() ?: ""
            if (type == "NEW_TRIP_OFFER") {
                val bookingData = toMap(event["data"] ?: event["Data"]) ?: event
                showTripOfferOverlay(bookingData)
                return
            }

            // Fallback: try to show overlay from legacy payloads
            val title = event["title"]?.toString() ?: "New Notification"
            val message = event["message"]?.toString() ?: ""
            android.util.Log.d("SocketForegroundService", "Received notification type=$type title=$title")
            showTripOfferOverlay(event, titleFallback = title, messageFallback = message)
        } catch (e: Exception) {
            android.util.Log.e("SocketForegroundService", "Error handling notification event: ${e.message}", e)
        }
    }

    private fun createForegroundNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Notification Service Active")
            .setContentText("Receiving real-time notifications...")
            .setSmallIcon(R.mipmap.ic_launcher) // Use launcher icon
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Socket Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Service for maintaining socket connection"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun showTripOfferOverlay(
        data: Map<String, Any?>,
        titleFallback: String? = null,
        messageFallback: String? = null,
    ) {
        try {
            // Extract trip details from data if available
            val tripId =
                data["bookingId"]?.toString()
                    ?: data["BookingID"]?.toString()
                    ?: data["tripId"]?.toString()
                    ?: data["TripID"]?.toString()
                    ?: ""

            if (tripId.isBlank()) {
                android.util.Log.w("SocketForegroundService", "Trip offer payload missing tripId/bookingId; skipping overlay")
                return
            }

            val fare =
                data["estimatedFare"]?.toString()
                    ?: data["EstimatedFare"]?.toString()
                    ?: data["fare"]?.toString()
                    ?: data["Fare"]?.toString()
                    ?: "0"

            val pickup =
                extractAddress(
                    data["pickupLocation"]
                        ?: data["PickupLocation"]
                        ?: data["pickup"]
                        ?: data["pickup_location"]
                ).ifBlank { titleFallback ?: "" }

            val drop =
                extractAddress(
                    data["dropLocation"]
                        ?: data["DropLocation"]
                        ?: data["drop"]
                        ?: data["drop_location"]
                ).ifBlank { messageFallback ?: "" }

            val customerName =
                data["customerName"]?.toString()
                    ?: data["CustomerName"]?.toString()
                    ?: (toMap(data["customer"])?.get("name")?.toString())
                    ?: "Customer"
            
            val intent = Intent(this, OverlayService::class.java).apply {
                putExtra("action", "show")
                putExtra("tripId", tripId)
                putExtra("fare", fare)
                putExtra("pickup", pickup)
                putExtra("drop", drop)
                putExtra("customerName", customerName)
            }
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
            
            android.util.Log.d("SocketForegroundService", "Overlay service started for trip: $tripId")
        } catch (e: Exception) {
            android.util.Log.e("SocketForegroundService", "Error showing overlay notification: ${e.message}", e)
        }
    }

    private fun extractAddress(value: Any?): String {
        if (value == null) return ""
        if (value is String) return value

        val map = toMap(value) ?: return value.toString()
        return map["address"]?.toString()
            ?: map["Address"]?.toString()
            ?: map["name"]?.toString()
            ?: map["Name"]?.toString()
            ?: ""
    }

    private fun toMap(value: Any?): Map<String, Any?>? {
        return try {
            when (value) {
                null -> null
                is Map<*, *> -> value.entries.associate { it.key.toString() to it.value }
                is JSONObject -> gson.fromJson(value.toString(), mapType)
                is String -> {
                    val trimmed = value.trim()
                    if (trimmed.startsWith("{") && trimmed.endsWith("}")) gson.fromJson(trimmed, mapType) else null
                }
                else -> {
                    // socket.io-client may pass JSONObject-like objects; best-effort parse from toString()
                    val text = value.toString().trim()
                    if (text.startsWith("{") && text.endsWith("}")) gson.fromJson(text, mapType) else null
                }
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun getFCMToken(): String {
        // Get from SharedPreferences (set by NotificationMessagingService)
        val sharedPref = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        return sharedPref.getString("fcm_token", "") ?: ""
    }

    private fun getDriverAuthToken(): String {
        // Read token saved by Flutter's shared_preferences plugin (StorageService.saveToken)
        val sharedPref = getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
        return sharedPref.getString("flutter.driver_token", "") ?: ""
    }

    private fun generateDeviceId(): String {
        val sharedPref = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        var deviceId = sharedPref.getString("device_id", null)
        
        if (deviceId == null) {
            deviceId = java.util.UUID.randomUUID().toString()
            sharedPref.edit().putString("device_id", deviceId).apply()
        }
        
        return deviceId
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        try {
            socket?.disconnect()
            socket = null
            android.util.Log.d("SocketForegroundService", "Service destroyed")
        } catch (e: Exception) {
            android.util.Log.e("SocketForegroundService", "Error in onDestroy: ${e.message}", e)
        }
    }
}
