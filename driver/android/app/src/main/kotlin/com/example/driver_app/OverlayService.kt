package com.example.driver_app

import android.app.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.PixelFormat
import android.os.Build
import android.os.PowerManager
import android.view.*
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

class OverlayService : Service() {
    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var params: WindowManager.LayoutParams? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var floatingButtonView: View? = null
    private var floatingButtonParams: WindowManager.LayoutParams? = null
    private var screenReceiver: BroadcastReceiver? = null
    private var currentTripId: String? = null
    private var currentFare: String? = null
    private var currentPickup: String? = null
    private var currentDrop: String? = null
    private var currentCustomerName: String? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        
        // Acquire wake lock to keep service running when screen is locked
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "OverlayService::WakeLock"
        ).apply {
            acquire(10*60*60*1000L /*10 hours*/) // Keep for 10 hours
        }
        
        // Register screen on/off receiver to restore overlay when screen turns on
        registerScreenReceiver()
    }
    
    private fun registerScreenReceiver() {
        screenReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                when (intent?.action) {
                    Intent.ACTION_SCREEN_ON -> {
                        android.util.Log.d("OverlayService", "📱 Screen turned ON - restoring overlays")
                        // Restore floating button
                        if (floatingButtonView == null) {
                            showFloatingButton()
                        }
                        // Restore trip overlay if it was showing
                        if (overlayView == null && currentTripId != null) {
                            currentTripId?.let { tripId ->
                                currentFare?.let { fare ->
                                    currentPickup?.let { pickup ->
                                        currentDrop?.let { drop ->
                                            currentCustomerName?.let { customerName ->
                                                showOverlay(tripId, fare, pickup, drop, customerName)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Intent.ACTION_SCREEN_OFF -> {
                        android.util.Log.d("OverlayService", "📱 Screen turned OFF - keeping service alive")
                        // Don't remove overlays, just log
                    }
                    Intent.ACTION_USER_PRESENT -> {
                        android.util.Log.d("OverlayService", "📱 User unlocked - ensuring overlays visible")
                        // Ensure overlays are visible after unlock
                        if (floatingButtonView == null) {
                            showFloatingButton()
                        }
                    }
                }
            }
        }
        
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_USER_PRESENT)
        }
        registerReceiver(screenReceiver, filter)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        android.util.Log.d("OverlayService", "========================================")
        android.util.Log.d("OverlayService", "📥 onStartCommand called")
        android.util.Log.d("OverlayService", "   Intent: ${intent?.toString()}")
        
        val action = intent?.getStringExtra("action")
        android.util.Log.d("OverlayService", "   Action: $action")
        
        when (action) {
            "start" -> {
                // Service started - keep it running in background and show floating button
                android.util.Log.d("OverlayService", "🚀 Service started, showing floating button")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    startForeground(1, createNotification(), android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
                } else {
                    startForeground(1, createNotification())
                }
                showFloatingButton()
            }
            "show" -> {
                android.util.Log.d("OverlayService", "📱 SHOW action received!")
                val tripId = intent?.getStringExtra("tripId") ?: ""
                val fare = intent?.getStringExtra("fare") ?: "0"
                val pickup = intent?.getStringExtra("pickup") ?: ""
                val drop = intent?.getStringExtra("drop") ?: ""
                val customerName = intent?.getStringExtra("customerName") ?: "Customer"
                
                android.util.Log.d("OverlayService", "   Extracted data:")
                android.util.Log.d("OverlayService", "     tripId: $tripId")
                android.util.Log.d("OverlayService", "     fare: $fare")
                android.util.Log.d("OverlayService", "     pickup: $pickup")
                android.util.Log.d("OverlayService", "     drop: $drop")
                android.util.Log.d("OverlayService", "     customerName: $customerName")
                
                // Ensure service is in foreground before showing overlay
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                        startForeground(1, createNotification(), android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
                    } else {
                        startForeground(1, createNotification())
                    }
                    android.util.Log.d("OverlayService", "✅ Foreground service ensured")
                } catch (e: Exception) {
                    android.util.Log.e("OverlayService", "⚠️ Error ensuring foreground: ${e.message}")
                }
                
                showOverlay(tripId, fare, pickup, drop, customerName)
            }
            "hide" -> {
                android.util.Log.d("OverlayService", "🚫 HIDE action received")
                hideOverlay()
            }
            null -> {
                android.util.Log.w("OverlayService", "⚠️ No action specified in intent")
            }
            else -> {
                android.util.Log.w("OverlayService", "⚠️ Unknown action: $action")
            }
        }
        android.util.Log.d("OverlayService", "========================================")
        // Return START_STICKY to restart service if killed by system
        return START_STICKY
    }
    
    private fun showFloatingButton() {
        if (floatingButtonView != null) {
            android.util.Log.d("OverlayService", "Floating button already showing")
            return
        }
        
        try {
            android.util.Log.d("OverlayService", "📦 Creating floating button...")
            val layoutInflater = LayoutInflater.from(this)
            floatingButtonView = layoutInflater.inflate(R.layout.overlay_floating_button, null)
            
            // Position at bottom right
            val displayMetrics = resources.displayMetrics
            val screenWidth = displayMetrics.widthPixels
            val screenHeight = displayMetrics.heightPixels
            
            // Convert dp to pixels (80dp = ~120px on most devices)
            val buttonSize = (80 * displayMetrics.density).toInt()
            
            floatingButtonParams = WindowManager.LayoutParams(
                buttonSize, // width (80dp)
                buttonSize, // height (80dp)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_PHONE
                },
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                // Start at bottom right corner
                x = screenWidth - buttonSize - 24
                y = screenHeight - buttonSize - 200
            }
            
            // Make the view clickable and focusable for touch events
            floatingButtonView?.isClickable = true
            floatingButtonView?.isFocusable = false
            
            // Make button draggable
            var initialX = floatingButtonParams!!.x
            var initialY = floatingButtonParams!!.y
            var initialTouchX = 0f
            var initialTouchY = 0f
            var isDragging = false
            
            floatingButtonView?.setOnTouchListener(object : View.OnTouchListener {
                override fun onTouch(v: View?, event: MotionEvent?): Boolean {
                    when (event?.action) {
                        MotionEvent.ACTION_DOWN -> {
                            initialX = floatingButtonParams!!.x
                            initialY = floatingButtonParams!!.y
                            initialTouchX = event.rawX
                            initialTouchY = event.rawY
                            isDragging = false
                            v?.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)
                            return true
                        }
                        MotionEvent.ACTION_MOVE -> {
                            val deltaX = event.rawX - initialTouchX
                            val deltaY = event.rawY - initialTouchY
                            
                            // Check if movement is significant (more than 5px) to consider it dragging
                            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                                isDragging = true
                            }
                            
                            if (isDragging) {
                                var newX = initialX + deltaX.toInt()
                                var newY = initialY + deltaY.toInt()
                                
                                // Keep button within screen bounds
                                val maxX = screenWidth - buttonSize - 16
                                val maxY = screenHeight - buttonSize - 100
                                newX = newX.coerceIn(0, maxX)
                                newY = newY.coerceIn(0, maxY)
                                
                                floatingButtonParams!!.x = newX
                                floatingButtonParams!!.y = newY
                                
                                try {
                                    windowManager?.updateViewLayout(floatingButtonView, floatingButtonParams)
                                } catch (e: Exception) {
                                    android.util.Log.e("OverlayService", "Error updating button position: ${e.message}")
                                }
                            }
                            return true
                        }
                        MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                            // If not dragging, treat as click
                            if (!isDragging) {
                                val intent = Intent(this@OverlayService, MainActivity::class.java).apply {
                                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                                }
                                startActivity(intent)
                            }
                            isDragging = false
                            return true
                        }
                    }
                    return false
                }
            })
            
            windowManager?.addView(floatingButtonView, floatingButtonParams)
            android.util.Log.d("OverlayService", "✅ Floating button shown successfully!")
        } catch (e: Exception) {
            android.util.Log.e("OverlayService", "❌ Error showing floating button: ${e.message}", e)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "overlay_channel",
                "Trip Notifications",
                NotificationManager.IMPORTANCE_HIGH // High importance to show on lock screen
            ).apply {
                description = "Shows trip notifications and keeps service running"
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC // Show on lock screen
                // Make channel non-dismissible
                setBypassDnd(true) // Bypass Do Not Disturb
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    setAllowBubbles(false) // Don't allow bubbles
                }
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
            
            // On Android 8.0+, make sure the channel can't be disabled
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                    val existingChannel = notificationManager.getNotificationChannel("overlay_channel")
                    if (existingChannel != null && existingChannel.importance < NotificationManager.IMPORTANCE_HIGH) {
                        // Recreate with higher importance if it was downgraded
                        notificationManager.deleteNotificationChannel("overlay_channel")
                        notificationManager.createNotificationChannel(channel)
                    }
                } catch (e: Exception) {
                    android.util.Log.e("OverlayService", "Error ensuring channel importance: ${e.message}")
                }
            }
        }
    }

    private fun showOverlay(tripId: String, fare: String, pickup: String, drop: String, customerName: String) {
        android.util.Log.d("OverlayService", "========================================")
        android.util.Log.d("OverlayService", "🚀 showOverlay() METHOD CALLED")
        android.util.Log.d("OverlayService", "   tripId: $tripId")
        android.util.Log.d("OverlayService", "   fare: $fare")
        android.util.Log.d("OverlayService", "   pickup: $pickup")
        android.util.Log.d("OverlayService", "   drop: $drop")
        android.util.Log.d("OverlayService", "========================================")
        
        // Store trip data for restoration after screen unlock
        currentTripId = tripId
        currentFare = fare
        currentPickup = pickup
        currentDrop = drop
        currentCustomerName = customerName
        
        if (overlayView != null) {
            android.util.Log.w("OverlayService", "⚠️ Overlay already showing, removing old one first")
            try {
                windowManager?.removeView(overlayView)
            } catch (e: Exception) {
                android.util.Log.e("OverlayService", "Error removing old overlay: ${e.message}")
            }
            overlayView = null
        }

        android.util.Log.d("OverlayService", "📦 Step 1: Inflating overlay layout...")
        try {
            val layoutInflater = LayoutInflater.from(this)
            overlayView = layoutInflater.inflate(R.layout.overlay_trip_notification, null)
            
            if (overlayView == null) {
                android.util.Log.e("OverlayService", "❌ Failed to inflate overlay layout!")
                return
            }
            
            android.util.Log.d("OverlayService", "✅ Step 1: Layout inflated successfully")
        } catch (e: Exception) {
            android.util.Log.e("OverlayService", "❌ Error inflating layout: ${e.message}", e)
            return
        }

        // Set trip data
        overlayView?.findViewById<TextView>(R.id.tvFare)?.text = "₹$fare"
        overlayView?.findViewById<TextView>(R.id.tvPickup)?.text = pickup
        overlayView?.findViewById<TextView>(R.id.tvDrop)?.text = drop

        // Accept button - communicate back to Flutter via MainActivity
        overlayView?.findViewById<Button>(R.id.btnAccept)?.setOnClickListener {
            android.util.Log.d("OverlayService", "========================================")
            android.util.Log.d("OverlayService", "✅✅✅ ACCEPT BUTTON CLICKED ✅✅✅")
            android.util.Log.d("OverlayService", "Trip ID: $tripId")
            android.util.Log.d("OverlayService", "========================================")
            
            // Create intent to notify MainActivity
            val acceptIntent = Intent("com.example.driver_app.OVERLAY_ACCEPT").apply {
                putExtra("tripId", tripId)
                putExtra("action", "accept")
                setPackage(packageName)
            }
            
            try {
                sendBroadcast(acceptIntent)
                android.util.Log.d("OverlayService", "✅ Broadcast sent successfully for trip: $tripId")
                
                // Also try to start MainActivity to ensure it receives the broadcast
                // This is a fallback in case MainActivity is not running
                try {
                    val mainIntent = Intent(this, MainActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                        putExtra("overlayAccept", true)
                        putExtra("tripId", tripId)
                    }
                    startActivity(mainIntent)
                    android.util.Log.d("OverlayService", "✅ MainActivity started/activated for accept")
                } catch (e: Exception) {
                    android.util.Log.e("OverlayService", "⚠️ Could not start MainActivity: ${e.message}")
                }
                
                // Show feedback to user
                Toast.makeText(this, "Accepting trip...", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                android.util.Log.e("OverlayService", "❌❌❌ ERROR SENDING ACCEPT BROADCAST ❌❌❌")
                android.util.Log.e("OverlayService", "Error: ${e.message}", e)
                Toast.makeText(this, "Error accepting trip", Toast.LENGTH_SHORT).show()
            }
            
            // Hide overlay after accepting
            hideOverlay()
        }

        // Dismiss button
        overlayView?.findViewById<ImageButton>(R.id.btnDismiss)?.setOnClickListener {
            hideOverlay()
        }

        // Get screen dimensions for bottom positioning
        val displayMetrics = resources.displayMetrics
        val screenWidth = displayMetrics.widthPixels
        val screenHeight = displayMetrics.heightPixels
        
        val params = WindowManager.LayoutParams(
            screenWidth, // Full width
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or 
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
            // Position at bottom of screen
            x = 0
            y = 0
        }
        
        this.params = params

        // Make draggable
        overlayView?.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f

            override fun onTouch(v: View?, event: MotionEvent?): Boolean {
                when (event?.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x
                        initialY = params.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        params.x = initialX + (event.rawX - initialTouchX).toInt()
                        params.y = initialY + (event.rawY - initialTouchY).toInt()
                        windowManager?.updateViewLayout(overlayView, params)
                        return true
                    }
                }
                return false
            }
        })

        try {
            android.util.Log.d("OverlayService", "🔔 Step 2: Ensuring foreground service...")
            // Start foreground service FIRST (before adding view) to avoid permission issues
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(1, createNotification(), android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
            } else {
                startForeground(1, createNotification())
            }
            android.util.Log.d("OverlayService", "✅ Step 2: Foreground service ensured")
            
            android.util.Log.d("OverlayService", "🪟 Step 3: Adding overlay view to WindowManager...")
            android.util.Log.d("OverlayService", "   overlayView is null: ${overlayView == null}")
            android.util.Log.d("OverlayService", "   windowManager is null: ${windowManager == null}")
            android.util.Log.d("OverlayService", "   params: width=${params.width}, height=${params.height}")
            android.util.Log.d("OverlayService", "   params: x=${params.x}, y=${params.y}")
            android.util.Log.d("OverlayService", "   params: type=${params.type}")
            android.util.Log.d("OverlayService", "   params: flags=${params.flags}")
            
            if (overlayView == null) {
                android.util.Log.e("OverlayService", "❌ overlayView is null! Cannot add to WindowManager")
                return
            }
            
            if (windowManager == null) {
                android.util.Log.e("OverlayService", "❌ windowManager is null! Cannot add view")
                return
            }
            
            // Then add the overlay view
            windowManager!!.addView(overlayView, params)
            android.util.Log.d("OverlayService", "✅✅✅ Step 3: Overlay view added to WindowManager!")
            android.util.Log.d("OverlayService", "✅✅✅ OVERLAY SHOULD NOW BE VISIBLE ON SCREEN!")
            
            // Update notification with trip details
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.notify(1, createNotification())
            android.util.Log.d("OverlayService", "✅ Step 4: Notification updated with trip details")
            android.util.Log.d("OverlayService", "========================================")
        } catch (e: Exception) {
            val errorMsg = "Failed to show overlay: ${e.message}"
            android.util.Log.e("OverlayService", "========================================")
            android.util.Log.e("OverlayService", "❌❌❌ ERROR SHOWING OVERLAY ❌❌❌")
            android.util.Log.e("OverlayService", "   Error: $errorMsg")
            android.util.Log.e("OverlayService", "   Exception type: ${e.javaClass.simpleName}")
            e.printStackTrace()
            android.util.Log.e("OverlayService", "========================================")
            
            // Show toast to user
            try {
                Toast.makeText(this, errorMsg, Toast.LENGTH_LONG).show()
            } catch (toastError: Exception) {
                android.util.Log.e("OverlayService", "Error showing toast: ${toastError.message}")
            }
            
            // Don't stop service - keep it running for next attempt
        }
    }

    private fun hideOverlay() {
        overlayView?.let {
            windowManager?.removeView(it)
            overlayView = null
        }
        // Clear stored trip data
        currentTripId = null
        currentFare = null
        currentPickup = null
        currentDrop = null
        currentCustomerName = null
        // Don't stop the service, just hide the overlay
        // This keeps the service running in the background
    }
    
    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        android.util.Log.d("OverlayService", "⚠️ Task removed - restarting service to keep it running")
        
        // Restart service when app is removed from recent apps
        // This prevents the service from being stopped when user swipes away the app
        val restartIntent = Intent(applicationContext, OverlayService::class.java).apply {
            putExtra("action", "start")
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(restartIntent)
        } else {
            startService(restartIntent)
        }
        
        android.util.Log.d("OverlayService", "✅ Service restart scheduled")
    }

    override fun onDestroy() {
        android.util.Log.d("OverlayService", "⚠️ onDestroy called - service is being destroyed")
        
        // Try to restart the service if it's being destroyed
        // This helps keep the service running even if something tries to stop it
        try {
            val restartIntent = Intent(applicationContext, OverlayService::class.java).apply {
                putExtra("action", "start")
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(restartIntent)
            } else {
                startService(restartIntent)
            }
            android.util.Log.d("OverlayService", "✅ Service restart attempted in onDestroy")
        } catch (e: Exception) {
            android.util.Log.e("OverlayService", "❌ Error restarting service in onDestroy: ${e.message}")
        }
        
        super.onDestroy()
        
        // Unregister screen receiver
        screenReceiver?.let {
            try {
                unregisterReceiver(it)
            } catch (e: Exception) {
                android.util.Log.e("OverlayService", "Error unregistering screen receiver: ${e.message}")
            }
        }
        screenReceiver = null
        
        // Release wake lock
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
        wakeLock = null
        
        // Remove overlay view if still present
        overlayView?.let {
            windowManager?.removeView(it)
            overlayView = null
        }
        
        // Remove floating button if still present
        floatingButtonView?.let {
            windowManager?.removeView(it)
            floatingButtonView = null
        }
        
        // Clear stored data
        currentTripId = null
        currentFare = null
        currentPickup = null
        currentDrop = null
        currentCustomerName = null
    }

    private fun createNotification(): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.getActivity(
                this, 0, notificationIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        } else {
            @Suppress("DEPRECATION")
            PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT)
        }
        
        // Show trip info in notification if available
        val contentText = if (currentTripId != null && currentFare != null) {
            "New trip available: ₹$currentFare - Tap to view"
        } else {
            "Service running - Ready for trip notifications"
        }
        
        return NotificationCompat.Builder(this, "overlay_channel")
            .setContentTitle("🚗 Driver App Active")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true) // Cannot be dismissed by user
            .setAutoCancel(false) // Don't auto-cancel
            .setPriority(NotificationCompat.PRIORITY_HIGH) // High priority to show on lock screen
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC) // Show on lock screen
            .setShowWhen(true)
            .setOnlyAlertOnce(true) // Don't alert repeatedly
            .setSilent(false) // Allow sound/vibration
            // Additional flags to prevent dismissal
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setStyle(NotificationCompat.BigTextStyle().bigText(contentText))
            .build()
    }


    override fun onBind(intent: Intent?) = null
}

