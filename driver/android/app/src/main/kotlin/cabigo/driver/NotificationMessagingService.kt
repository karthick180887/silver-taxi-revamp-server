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

        val title = remoteMessage.notification?.title ?: "New Notification"
        val message = remoteMessage.notification?.body ?: ""
        val data = remoteMessage.data

        // Handle based on app state
        if (isAppInForeground()) {
            // App is in foreground - show overlay via socket already
            // But also show FCM notification as backup if needed
             // showNotification(title, message)
        } else {
            // App is in background/closed - show FCM notification
            showNotification(title, message)
            
            // Also try to show overlay via service
            // Convert data map to correct format if needed
             showOverlayViaService(title, message, data)
        }
    }

    private fun showNotification(title: String, message: String) {
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

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify((System.currentTimeMillis() / 1000).toInt(), notification)
    }

    private fun showOverlayViaService(title: String, message: String, data: Map<String, String>) {
        val intent = Intent(this, OverlayService::class.java).apply {
            putExtra("title", title)
            putExtra("message", message)
            putExtra("data", data.toString())
            putExtra("action", "show")
        }
        startService(intent)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "FCM Notifications",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Firebase Cloud Messaging notifications"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun isAppInForeground(): Boolean {
        val appState = getSharedPreferences("app_state", Context.MODE_PRIVATE)
        return appState.getBoolean("is_foreground", false)
    }
}
