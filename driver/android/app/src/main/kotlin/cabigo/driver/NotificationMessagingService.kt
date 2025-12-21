package cabigo.driver

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

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
            val title = remoteMessage.notification?.title ?: "New Notification"
            val message = remoteMessage.notification?.body ?: ""
            val data = remoteMessage.data

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
            val tripId = data["bookingId"] ?: data["tripId"] ?: ""
            val fare = data["fare"] ?: data["estimatedFare"] ?: "0"
            val pickup = data["pickup"] ?: data["pickupLocation"] ?: title
            val drop = data["drop"] ?: data["dropLocation"] ?: message
            val customerName = data["customerName"] ?: "Customer"
            
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
        return appState.getBoolean("is_foreground", false)
    }
}
