package cabigo.driver

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import org.json.JSONObject

class NotificationMessagingService : FirebaseMessagingService() {

    companion object {
        private const val NOTIFICATION_CHANNEL_ID = "fcm_notifications"
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Save token to SharedPreferences
        val sharedPref = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        sharedPref.edit().putString("fcm_token", token).apply()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        try {
            val data = remoteMessage.data
            val title = remoteMessage.notification?.title ?: data["title"] ?: "New Notification"
            val message = remoteMessage.notification?.body ?: data["message"] ?: ""

            android.util.Log.d("NotificationMessagingService", "FCM message received: $title - $message")
            android.util.Log.d("NotificationMessagingService", "Data: $data")

            // Handle based on app state
            if (isAppInForeground()) {
                // App is in foreground - show overlay via socket already
                // But also show FCM notification as backup if needed
                // showNotification(title, message)
                android.util.Log.d("NotificationMessagingService", "App in foreground, overlay handled by socket")
            } else {
                // App is in background/closed - show FCM notification
                try {
                    showNotification(title, message)
                } catch (e: Exception) {
                    android.util.Log.e("NotificationMessagingService", "Error showing notification: ${e.message}", e)
                }
                
                // Also try to show overlay via service
                try {
                    showOverlayViaService(title, message, data)
                } catch (e: Exception) {
                    android.util.Log.e("NotificationMessagingService", "Error showing overlay: ${e.message}", e)
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("NotificationMessagingService", "Error in onMessageReceived: ${e.message}", e)
        }
    }

    private fun showNotification(title: String, message: String) {
        try {
            createNotificationChannel()
            
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                this, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val notification = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
                .setAutoCancel(true)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(message)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .build()

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            if (notificationManager != null) {
                notificationManager.notify((System.currentTimeMillis() / 1000).toInt(), notification)
            } else {
                android.util.Log.e("NotificationMessagingService", "NotificationManager is null")
            }
        } catch (e: Exception) {
            android.util.Log.e("NotificationMessagingService", "Error showing notification: ${e.message}", e)
        }
    }

    private fun showOverlayViaService(title: String, message: String, data: Map<String, String>) {
        try {
            // Extract trip details from FCM data
            val tripId =
                data["ids.bookingId"]
                    ?: data["bookingId"]
                    ?: data["ids.tripId"]
                    ?: data["tripId"]
                    ?: ""

            val fare =
                data["estimatedFare"]
                    ?: data["fare"]
                    ?: data["estimatedAmount"]
                    ?: data["finalAmount"]
                    ?: "0"

            val pickup = extractAddress(data["pickupLocation"] ?: data["pickup"] ?: data["pickup_location"], title)
            val drop = extractAddress(data["dropLocation"] ?: data["drop"] ?: data["drop_location"], message)
            val customerName = data["customerName"] ?: data["customer_name"] ?: "Customer"
            
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
            
            android.util.Log.d("NotificationMessagingService", "Overlay service started for trip: $tripId")
        } catch (e: Exception) {
            android.util.Log.e("NotificationMessagingService", "Error showing overlay via service: ${e.message}", e)
        }
    }

    private fun extractAddress(raw: String?, fallback: String): String {
        if (raw.isNullOrBlank()) return fallback
        val trimmed = raw.trim()

        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try {
                val json = JSONObject(trimmed)
                return json.optString("address")
                    .ifBlank { json.optString("Address") }
                    .ifBlank { json.optString("name") }
                    .ifBlank { json.optString("Name") }
                    .ifBlank { fallback }
            } catch (_: Exception) {
                // fall through
            }
        }

        return raw
    }

    private fun createNotificationChannel() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    NOTIFICATION_CHANNEL_ID,
                    "FCM Notifications",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Firebase Cloud Messaging notifications"
                }
                val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                if (manager != null) {
                    manager.createNotificationChannel(channel)
                } else {
                    android.util.Log.e("NotificationMessagingService", "NotificationManager is null")
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("NotificationMessagingService", "Error creating notification channel: ${e.message}", e)
        }
    }

    private fun isAppInForeground(): Boolean {
        val appState = getSharedPreferences("app_state", Context.MODE_PRIVATE)
        val isForeground = appState.getBoolean("is_foreground", false)
        if (!isForeground) return false

        // If the app process was killed while the flag was true, we can end up with stale state.
        // Validate using the stored PID (written by MainActivity) against the current process PID.
        val lastPid = appState.getInt("pid", -1)
        return lastPid == Process.myPid()
    }
}
