package cabigo.driver

import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Firebase Cloud Messaging service that handles messages even when app is killed.
 * This allows showing the native overlay for new trip offers in the background.
 */
class DriverFCMService : FirebaseMessagingService() {
    
    companion object {
        private const val TAG = "DriverFCMService"
    }
    
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        Log.d(TAG, "========================================")
        Log.d(TAG, "📨 FCM MESSAGE RECEIVED (Native)")
        Log.d(TAG, "  From: ${remoteMessage.from}")
        Log.d(TAG, "  Data: ${remoteMessage.data}")
        Log.d(TAG, "  Notification: ${remoteMessage.notification?.title} - ${remoteMessage.notification?.body}")
        Log.d(TAG, "========================================")
        
        // Check if this is a new trip notification
        val messageType = remoteMessage.data["type"] ?: ""
        
        if (messageType == "NEW_TRIP_OFFER" || messageType == "new-booking") {
            Log.d(TAG, "🚗 NEW TRIP OFFER detected - triggering overlay")
            showTripOverlay(remoteMessage.data)
        } else {
            Log.d(TAG, "ℹ️ Message type '$messageType' - not a trip offer, ignoring overlay")
        }
    }
    
    private fun showTripOverlay(data: Map<String, String>) {
        try {
            val tripId = data["bookingId"] ?: ""
            val fare = data["estimatedPrice"] ?: data["fare"] ?: "0"
            val pickup = data["pickup"] ?: "Pickup Location"
            val drop = data["drop"] ?: "Drop Location"
            val customerName = data["customerName"] ?: "Customer"
            
            Log.d(TAG, "📋 Preparing overlay with:")
            Log.d(TAG, "   tripId: $tripId")
            Log.d(TAG, "   fare: ₹$fare")
            Log.d(TAG, "   pickup: $pickup")
            Log.d(TAG, "   drop: $drop")
            Log.d(TAG, "   customerName: $customerName")
            
            if (tripId.isEmpty()) {
                Log.w(TAG, "⚠️ Trip ID is empty, skipping overlay")
                return
            }
            
            // Start the overlay service with trip details
            val serviceIntent = Intent(this, OverlayService::class.java)
            serviceIntent.putExtra("action", "show")
            serviceIntent.putExtra("tripId", tripId)
            serviceIntent.putExtra("fare", fare)
            serviceIntent.putExtra("pickup", pickup)
            serviceIntent.putExtra("drop", drop)
            serviceIntent.putExtra("customerName", customerName)
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
            
            Log.d(TAG, "✅ Overlay service started for trip: $tripId")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error showing overlay: ${e.message}", e)
        }
    }
    
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "🔑 New FCM token: $token")
        // The Flutter app will handle token registration when it starts
    }
}
