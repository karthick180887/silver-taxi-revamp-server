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
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.net.URISyntaxException

class SocketForegroundService : Service() {

    private var socket: Socket? = null
    private val serviceScope = CoroutineScope(Dispatchers.Main)
    private val NOTIFICATION_ID = 1
    private val CHANNEL_ID = "socket_service_channel"

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
            // Options for socket.io-client 2.x
            val options = IO.Options()
            options.reconnection = true
            options.reconnectionDelay = 1000
            options.reconnectionDelayMax = 5000
            options.reconnectionAttempts = Integer.MAX_VALUE
            options.transports = arrayOf("websocket") // Force WebSocket

            socket = IO.socket("https://api.cabigo.in", options)

            socket?.on(Socket.EVENT_CONNECT) {
                handleSocketConnected()
            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                handleSocketDisconnected()
            }

            socket?.on(Socket.EVENT_CONNECT_ERROR) {
                // handleSocketError(it[0] as Exception)
            }

            // Listen for notification events from backend
            socket?.on("notification") { args ->
                handleNotificationEvent(args)
            }

            socket?.connect()

        } catch (e: URISyntaxException) {
            e.printStackTrace()
        }
    }

    private fun handleSocketConnected() {
        // Send device FCM token to backend
        val fcmToken = getFCMToken()
        socket?.emit("register_device", mapOf(
            "fcmToken" to fcmToken,
            "deviceId" to generateDeviceId(),
            "timestamp" to System.currentTimeMillis()
        ))
    }

    private fun handleSocketDisconnected() {
        // Socket will auto-reconnect due to config
    }

    private fun handleNotificationEvent(args: Array<Any>) {
        try {
            val data = args[0] as? Map<*, *> ?: return
            
            // Show overlay popup
            showOverlayNotification(
                title = data["title"] as? String ?: "New Notification",
                message = data["message"] as? String ?: "",
                data = data
            )
        } catch (e: Exception) {
            e.printStackTrace()
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

    private fun showOverlayNotification(title: String, message: String, data: Map<*, *>) {
        val intent = Intent(this, OverlayService::class.java).apply {
            putExtra("title", title)
            putExtra("message", message)
            putExtra("data", data.toString())
            putExtra("action", "show") // Matches OverlayService "show" action
        }
        startService(intent)
    }

    private fun getFCMToken(): String {
        // Get from SharedPreferences (set by NotificationMessagingService)
        val sharedPref = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        return sharedPref.getString("fcm_token", "") ?: ""
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
        socket?.disconnect()
    }
}
