package cabigo.driver

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

class OverlayService : Service() {

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var floatingButtonView: View? = null
    private var isShowing = false
    private var isFloatingButtonShowing = false
    private val NOTIFICATION_ID = 2
    private val CHANNEL_ID = "overlay_service_channel"
    private val API_BASE_URL = "https://api.cabigo.in"

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)

        try {
            // Start as foreground service to keep it running
            val notification = createForegroundNotification()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }

            val action = intent?.getStringExtra("action") ?: "start"
            
            when (action) {
                "show" -> {
                    val tripId = intent?.getStringExtra("tripId") ?: ""
                    val fare = intent?.getStringExtra("fare") ?: "0"
                    val pickup = intent?.getStringExtra("pickup") ?: ""
                    val drop = intent?.getStringExtra("drop") ?: ""
                    val customerName = intent?.getStringExtra("customerName") ?: "Customer"
                    
                    showOverlay(tripId, fare, pickup, drop, customerName)
                    
                    // Auto-hide after 30 seconds (trip offers usually expire)
                    CoroutineScope(Dispatchers.Main).launch {
                        delay(30000)
                        hideOverlay()
                    }
                }
                "hide" -> {
                    hideOverlay()
                }
                "start" -> {
                    // Service start requested - show persistent floating button
                    android.util.Log.d("OverlayService", "Service started, showing floating button")
                    showFloatingButton()
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("OverlayService", "Error in onStartCommand: ${e.message}", e)
            // Don't stop service on error - keep it running
        }

        return START_STICKY // Keep service running even if killed
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
            .setContentTitle("Driver Service Active")
            .setContentText("Tap to open app")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Overlay Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Service for showing overlay notifications"
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.createNotificationChannel(channel)
        }
    }

    private fun showOverlay(tripId: String, fare: String, pickup: String, drop: String, customerName: String) {
        try {
            if (isShowing) {
                hideOverlay()
            }

            // Check overlay permission
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!android.provider.Settings.canDrawOverlays(this)) {
                    android.util.Log.e("OverlayService", "Overlay permission not granted")
                    return
                }
            }

            windowManager = getSystemService(Context.WINDOW_SERVICE) as? WindowManager
            if (windowManager == null) {
                android.util.Log.e("OverlayService", "WindowManager is null")
                return
            }
            
            // Create overlay view (wrap with swipe-to-dismiss container)
            overlayView = try {
                val layoutId = resources.getIdentifier("overlay_trip_notification", "layout", packageName)
                if (layoutId != 0) {
                    val content = LayoutInflater.from(this).inflate(layoutId, null)
                    SwipeDismissLayout(this@OverlayService).apply {
                        onDismiss = { rejectTripOffer(tripId, "swipe") }
                        addView(content)
                    }
                } else {
                    null
                }
            } catch (e: Exception) {
                android.util.Log.w("OverlayService", "Layout not found, creating programmatic view: ${e.message}")
                // Create a simple programmatic view
                val content = FrameLayout(this).apply {
                    setBackgroundColor(0xFF2196F3.toInt())
                    setPadding(32, 32, 32, 32)
                    
                    val titleView = TextView(this@OverlayService).apply {
                        text = "New Trip Offer - ₹$fare"
                        textSize = 18f
                        setTextColor(0xFFFFFFFF.toInt())
                        setTypeface(null, android.graphics.Typeface.BOLD)
                    }
                    
                    val pickupView = TextView(this@OverlayService).apply {
                        text = "Pickup: $pickup"
                        textSize = 14f
                        setTextColor(0xFFFFFFFF.toInt())
                    }
                    
                    val dropView = TextView(this@OverlayService).apply {
                        text = "Drop: $drop"
                        textSize = 14f
                        setTextColor(0xFFFFFFFF.toInt())
                    }
                    
                    val acceptButton = Button(this@OverlayService).apply {
                        text = "Accept"
                        setOnClickListener {
                            // Send broadcast to MainActivity
                            val acceptIntent = Intent("cabigo.driver.OVERLAY_ACCEPT").apply {
                                putExtra("tripId", tripId)
                            }
                            sendBroadcast(acceptIntent)

                            // Bring app to foreground (handles accept even if app was killed)
                            try {
                                val openIntent = Intent(this@OverlayService, MainActivity::class.java).apply {
                                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                                    putExtra("overlayAccept", true)
                                    putExtra("tripId", tripId)
                                    putExtra("fromOverlay", true)
                                    putExtra("unlock", true)
                                }
                                startActivity(openIntent)
                            } catch (e: Exception) {
                                android.util.Log.w("OverlayService", "Error opening app on accept: ${e.message}")
                            }
                            hideOverlay()
                        }
                    }
                    
                    val dismissButton = Button(this@OverlayService).apply {
                        text = "Dismiss"
                        setOnClickListener {
                            rejectTripOffer(tripId, "button")
                        }
                    }
                    
                    val layout = android.widget.LinearLayout(this@OverlayService).apply {
                        orientation = android.widget.LinearLayout.VERTICAL
                        addView(titleView)
                        addView(pickupView)
                        addView(dropView)
                        
                        val buttonLayout = android.widget.LinearLayout(this@OverlayService).apply {
                            orientation = android.widget.LinearLayout.HORIZONTAL
                            addView(acceptButton)
                            addView(dismissButton)
                        }
                        addView(buttonLayout)
                    }
                    
                    addView(layout)
                }

                SwipeDismissLayout(this@OverlayService).apply {
                    onDismiss = { rejectTripOffer(tripId, "swipe") }
                    addView(content)
                }
            }

            if (overlayView == null) {
                android.util.Log.e("OverlayService", "Failed to create overlay view")
                return
            }

            // Try to populate layout fields if they exist
            try {
                val titleId = resources.getIdentifier("tvFare", "id", packageName)
                if (titleId != 0) {
                    overlayView?.findViewById<TextView>(titleId)?.text = "₹$fare"
                }
                
                val pickupId = resources.getIdentifier("tvPickup", "id", packageName)
                if (pickupId != 0) {
                    overlayView?.findViewById<TextView>(pickupId)?.text = pickup
                }
                
                val dropId = resources.getIdentifier("tvDrop", "id", packageName)
                if (dropId != 0) {
                    overlayView?.findViewById<TextView>(dropId)?.text = drop
                }
                
                val acceptButtonId = resources.getIdentifier("btnAccept", "id", packageName)
                if (acceptButtonId != 0) {
                    overlayView?.findViewById<View>(acceptButtonId)?.setOnClickListener {
                        val acceptIntent = Intent("cabigo.driver.OVERLAY_ACCEPT").apply {
                            putExtra("tripId", tripId)
                        }
                        sendBroadcast(acceptIntent)

                        // Bring app to foreground (handles accept even if app was killed)
                        try {
                            val openIntent = Intent(this@OverlayService, MainActivity::class.java).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                                putExtra("overlayAccept", true)
                                putExtra("tripId", tripId)
                                putExtra("fromOverlay", true)
                                putExtra("unlock", true)
                            }
                            startActivity(openIntent)
                        } catch (e: Exception) {
                            android.util.Log.w("OverlayService", "Error opening app on accept: ${e.message}")
                        }
                        hideOverlay()
                    }
                }

                val dismissButtonId = resources.getIdentifier("btnDismiss", "id", packageName)
                if (dismissButtonId != 0) {
                    overlayView?.findViewById<View>(dismissButtonId)?.setOnClickListener {
                        rejectTripOffer(tripId, "button")
                    }
                }
            } catch (e: Exception) {
                android.util.Log.w("OverlayService", "Error populating layout fields: ${e.message}")
            }
            
            // Window parameters
            val params = WindowManager.LayoutParams().apply {
                type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_PHONE
                }
                format = PixelFormat.TRANSLUCENT
                flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                width = WindowManager.LayoutParams.MATCH_PARENT
                height = WindowManager.LayoutParams.WRAP_CONTENT
                gravity = Gravity.TOP
                x = 0
                y = 0
            }

            windowManager?.addView(overlayView, params)
            isShowing = true
            android.util.Log.d("OverlayService", "Overlay shown successfully for trip: $tripId")
        } catch (e: Exception) {
            android.util.Log.e("OverlayService", "Error showing overlay: ${e.message}", e)
        }
    }

    private class SwipeDismissLayout(context: Context) : FrameLayout(context) {
        var onDismiss: (() -> Unit)? = null

        private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop
        private val dismissThresholdPx: Float = 120f * resources.displayMetrics.density

        private var downX = 0f
        private var downY = 0f
        private var swiping = false

        override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
            when (ev.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    downX = ev.rawX
                    downY = ev.rawY
                    swiping = false
                }

                MotionEvent.ACTION_MOVE -> {
                    val dx = ev.rawX - downX
                    val dy = ev.rawY - downY

                    // Intercept only when user is clearly swiping horizontally or vertically
                    if (kotlin.math.abs(dx) > touchSlop && kotlin.math.abs(dx) > kotlin.math.abs(dy)) {
                        swiping = true
                        parent?.requestDisallowInterceptTouchEvent(true)
                        return true
                    }

                    // Allow swipe-up to dismiss as well
                    if (kotlin.math.abs(dy) > touchSlop && kotlin.math.abs(dy) > kotlin.math.abs(dx) && dy < 0) {
                        swiping = true
                        parent?.requestDisallowInterceptTouchEvent(true)
                        return true
                    }
                }
            }
            return super.onInterceptTouchEvent(ev)
        }

        override fun onTouchEvent(event: MotionEvent): Boolean {
            if (!swiping) return super.onTouchEvent(event)

            when (event.actionMasked) {
                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - downX
                    val dy = event.rawY - downY
                    // Follow the dominant axis
                    translationX = dx
                    translationY = if (dy < 0) dy else 0f
                    alpha = (1f - (kotlin.math.abs(dx) / width.coerceAtLeast(1))).coerceIn(0.2f, 1f)
                }

                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    val dx = event.rawX - downX
                    val dy = event.rawY - downY
                    val shouldDismiss =
                        kotlin.math.abs(dx) > dismissThresholdPx || (dy < -dismissThresholdPx)

                    if (shouldDismiss) {
                        animate()
                            .translationX(if (dx >= 0) width.toFloat() else -width.toFloat())
                            .translationY(if (dy < 0) -height.toFloat() else 0f)
                            .alpha(0f)
                            .setDuration(180)
                            .withEndAction { onDismiss?.invoke() }
                            .start()
                    } else {
                        animate()
                            .translationX(0f)
                            .translationY(0f)
                            .alpha(1f)
                            .setDuration(180)
                            .start()
                    }
                    swiping = false
                    return true
                }
            }
            return true
        }
    }

    private fun hideOverlay() {
        try {
            if (isShowing && overlayView != null && windowManager != null) {
                windowManager?.removeView(overlayView)
                isShowing = false
                overlayView = null
                // Don't stop service - keep floating button visible
                // stopSelf()
            }
        } catch (e: Exception) {
            android.util.Log.e("OverlayService", "Error hiding overlay: ${e.message}", e)
            // Force cleanup
            isShowing = false
            overlayView = null
            // Don't stop service on error - keep floating button
        }
    }

    private fun getDriverAuthToken(): String {
        val sharedPref = getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
        return sharedPref.getString("flutter.driver_token", "") ?: ""
    }

    private fun rejectTripOffer(tripId: String, source: String) {
        if (tripId.isBlank()) {
            hideOverlay()
            return
        }

        hideOverlay()

        val authToken = getDriverAuthToken()
        if (authToken.isBlank()) {
            android.util.Log.w("OverlayService", "No driver auth token available; cannot reject tripId=$tripId")
            return
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val encodedTripId = URLEncoder.encode(tripId, Charsets.UTF_8.name())
                val url = URL("$API_BASE_URL/app/booking/accept/$encodedTripId")

                val connection = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 10_000
                    readTimeout = 10_000
                    doOutput = true
                    setRequestProperty("Authorization", "Bearer $authToken")
                    setRequestProperty("Content-Type", "application/json")
                }

                val body = JSONObject().apply {
                    put("action", "reject")
                    put("reason", "overlay_$source")
                }.toString()

                connection.outputStream.use { os ->
                    os.write(body.toByteArray(Charsets.UTF_8))
                }

                val code = connection.responseCode
                val responseText = try {
                    val stream = if (code in 200..299) connection.inputStream else connection.errorStream
                    stream?.bufferedReader()?.use { it.readText() } ?: ""
                } catch (_: Exception) {
                    ""
                } finally {
                    connection.disconnect()
                }

                android.util.Log.d(
                    "OverlayService",
                    "Reject sent (source=$source, tripId=$tripId) -> HTTP $code ${responseText.take(200)}"
                )
            } catch (e: Exception) {
                android.util.Log.e("OverlayService", "Error rejecting tripId=$tripId from overlay: ${e.message}", e)
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun showFloatingButton() {
        try {
            if (isFloatingButtonShowing) {
                android.util.Log.d("OverlayService", "Floating button already showing")
                return
            }

            // Check overlay permission
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!android.provider.Settings.canDrawOverlays(this)) {
                    android.util.Log.e("OverlayService", "Overlay permission not granted for floating button")
                    return
                }
            }

            windowManager = getSystemService(Context.WINDOW_SERVICE) as? WindowManager
            if (windowManager == null) {
                android.util.Log.e("OverlayService", "WindowManager is null")
                return
            }
            
            // Try to load floating button layout
            floatingButtonView = try {
                LayoutInflater.from(this).inflate(
                    resources.getIdentifier("overlay_floating_button", "layout", packageName),
                    null
                )
            } catch (e: Exception) {
                android.util.Log.w("OverlayService", "Floating button layout not found, creating programmatic view: ${e.message}")
                // Create a simple floating button programmatically
                FrameLayout(this).apply {
                    setBackgroundColor(0xFFFF6B35.toInt())
                    val params = android.view.ViewGroup.LayoutParams(
                        (80 * resources.displayMetrics.density).toInt(),
                        (80 * resources.displayMetrics.density).toInt()
                    )
                    layoutParams = params
                    
                    val textView = TextView(this@OverlayService).apply {
                        text = "🚗"
                        textSize = 40f
                        setTextColor(0xFFFFFFFF.toInt())
                        gravity = android.view.Gravity.CENTER
                    }
                    
                    addView(textView)
                    
                    // Make it clickable to open app
                    setOnClickListener {
                        val intent = Intent(this@OverlayService, MainActivity::class.java).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                        }
                        startActivity(intent)
                    }
                }
            }

            if (floatingButtonView == null) {
                android.util.Log.e("OverlayService", "Failed to create floating button view")
                return
            }
            
            // Window parameters for floating button (bottom right corner)
            val params = WindowManager.LayoutParams().apply {
                type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_PHONE
                }
                format = PixelFormat.TRANSLUCENT
                flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                width = (80 * resources.displayMetrics.density).toInt()
                height = (80 * resources.displayMetrics.density).toInt()
                gravity = Gravity.BOTTOM or Gravity.END
                x = (16 * resources.displayMetrics.density).toInt()
                y = (16 * resources.displayMetrics.density).toInt()
            }
            
            // Make floating button draggable
            var initialX = 0
            var initialY = 0
            var initialTouchX = 0f
            var initialTouchY = 0f
            
            floatingButtonView?.setOnTouchListener { view, event ->
                when (event.action) {
                    android.view.MotionEvent.ACTION_DOWN -> {
                        initialX = params.x
                        initialY = params.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        true
                    }
                    android.view.MotionEvent.ACTION_MOVE -> {
                        params.x = initialX + (event.rawX - initialTouchX).toInt()
                        params.y = initialY + (event.rawY - initialTouchY).toInt()
                        windowManager?.updateViewLayout(floatingButtonView, params)
                        true
                    }
                    android.view.MotionEvent.ACTION_UP -> {
                        // If it was a click (not a drag), open the app
                        if (kotlin.math.abs(event.rawX - initialTouchX) < 10 && 
                            kotlin.math.abs(event.rawY - initialTouchY) < 10) {
                            val intent = Intent(this, MainActivity::class.java).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                            }
                            startActivity(intent)
                        }
                        true
                    }
                    else -> false
                }
            }

            windowManager?.addView(floatingButtonView, params)
            isFloatingButtonShowing = true
            android.util.Log.d("OverlayService", "✅ Floating button shown successfully")
        } catch (e: Exception) {
            android.util.Log.e("OverlayService", "Error showing floating button: ${e.message}", e)
        }
    }

    private fun hideFloatingButton() {
        try {
            if (isFloatingButtonShowing && floatingButtonView != null && windowManager != null) {
                windowManager?.removeView(floatingButtonView)
                isFloatingButtonShowing = false
                floatingButtonView = null
                android.util.Log.d("OverlayService", "Floating button hidden")
            }
        } catch (e: Exception) {
            android.util.Log.e("OverlayService", "Error hiding floating button: ${e.message}", e)
            isFloatingButtonShowing = false
            floatingButtonView = null
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            hideOverlay()
            hideFloatingButton()
        } catch (e: Exception) {
            android.util.Log.e("OverlayService", "Error in onDestroy: ${e.message}", e)
        }
    }
}
