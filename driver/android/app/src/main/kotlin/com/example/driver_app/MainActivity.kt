package com.example.driver_app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.example.driver_app/overlay"
    private val OVERLAY_PERMISSION_REQUEST_CODE = 1001
    private var currentTripId: String? = null
    private var methodChannel: MethodChannel? = null
    private var acceptReceiver: BroadcastReceiver? = null

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Handle accept intent if app was started from overlay
        handleAcceptIntent(intent)
    }
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleAcceptIntent(intent)
    }
    
    private fun handleAcceptIntent(intent: Intent?) {
        if (intent?.getBooleanExtra("overlayAccept", false) == true) {
            val tripId = intent.getStringExtra("tripId") ?: ""
            Log.d("MainActivity", "========================================")
            Log.d("MainActivity", "📨📨📨 HANDLING ACCEPT INTENT 📨📨📨")
            Log.d("MainActivity", "Trip ID: $tripId")
            Log.d("MainActivity", "========================================")
            if (tripId.isNotEmpty() && methodChannel != null) {
                try {
                    methodChannel?.invokeMethod("onOverlayAccept", mapOf("tripId" to tripId))
                    Log.d("MainActivity", "✅✅✅ Sent accept to Flutter from intent for trip: $tripId")
                } catch (e: Exception) {
                    Log.e("MainActivity", "❌ Error sending accept from intent: ${e.message}", e)
                }
            }
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        
        methodChannel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
        
        // Handle accept intent if method channel is now available
        handleAcceptIntent(intent)
        
        // Register broadcast receiver for overlay accept events
        try {
            acceptReceiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context?, intent: Intent?) {
                    val tripId = intent?.getStringExtra("tripId") ?: ""
                    Log.d("MainActivity", "========================================")
                    Log.d("MainActivity", "📨📨📨 RECEIVED OVERLAY ACCEPT BROADCAST 📨📨📨")
                    Log.d("MainActivity", "Trip ID: $tripId")
                    Log.d("MainActivity", "Method Channel: ${if (methodChannel != null) "Available" else "NULL"}")
                    Log.d("MainActivity", "========================================")
                    if (tripId.isNotEmpty()) {
                        // Send to Flutter via method channel
                        try {
                            methodChannel?.invokeMethod("onOverlayAccept", mapOf("tripId" to tripId))
                            Log.d("MainActivity", "✅✅✅ Successfully sent accept to Flutter for trip: $tripId")
                        } catch (e: Exception) {
                            Log.e("MainActivity", "❌❌❌ ERROR SENDING ACCEPT TO FLUTTER ❌❌❌")
                            Log.e("MainActivity", "Error: ${e.message}", e)
                        }
                    } else {
                        Log.w("MainActivity", "⚠️ Received accept broadcast but tripId is empty")
                    }
                }
            }
            val filter = IntentFilter("com.example.driver_app.OVERLAY_ACCEPT")
            registerReceiver(acceptReceiver, filter)
            Log.d("MainActivity", "✅ Broadcast receiver registered successfully")
        } catch (e: Exception) {
            Log.e("MainActivity", "❌ Error registering broadcast receiver: ${e.message}", e)
        }
        
        // Start overlay service immediately when app starts (for persistent floating icon)
        // This ensures the service is always running
        try {
            if (checkOverlayPermission()) {
                val serviceIntent = Intent(this, OverlayService::class.java).apply {
                    putExtra("action", "start")
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(serviceIntent)
                } else {
                    startService(serviceIntent)
                }
                Log.d("MainActivity", "✅ Overlay service started on app launch")
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error starting overlay service: ${e.message}")
        }
        
        methodChannel?.setMethodCallHandler { call, result ->
            when (call.method) {
                "checkOverlayPermission" -> {
                    result.success(checkOverlayPermission())
                }
                "requestOverlayPermission" -> {
                    requestOverlayPermission()
                    result.success(null)
                }
                "showOverlay" -> {
                    val tripId = call.argument<String>("tripId") ?: ""
                    val fare = call.argument<String>("fare") ?: "0"
                    val pickup = call.argument<String>("pickup") ?: ""
                    val drop = call.argument<String>("drop") ?: ""
                    val customerName = call.argument<String>("customerName") ?: "Customer"
                    
                    Log.d("MainActivity", "📱 showOverlay called from Flutter")
                    Log.d("MainActivity", "   Trip ID: $tripId")
                    Log.d("MainActivity", "   Fare: ₹$fare")
                    Log.d("MainActivity", "   Pickup: $pickup")
                    Log.d("MainActivity", "   Drop: $drop")
                    
                    if (checkOverlayPermission()) {
                        Log.d("MainActivity", "✅ Permission granted, calling showOverlay()")
                        showOverlay(tripId, fare, pickup, drop, customerName)
                        // Store tripId for accept callback
                        currentTripId = tripId
                        result.success(true)
                        Log.d("MainActivity", "✅ showOverlay completed successfully")
                    } else {
                        Log.e("MainActivity", "❌ Permission denied!")
                        result.error("PERMISSION_DENIED", "Overlay permission not granted", null)
                    }
                }
                "hideOverlay" -> {
                    hideOverlay()
                    result.success(true)
                }
                "startService" -> {
                    // Start the overlay service in foreground mode
                    // This keeps it running even when app is closed or phone is locked
                    try {
                        if (checkOverlayPermission()) {
                            val serviceIntent = Intent(this, OverlayService::class.java).apply {
                                putExtra("action", "start")
                            }
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                startForegroundService(serviceIntent)
                            } else {
                                startService(serviceIntent)
                            }
                            Log.d("MainActivity", "✅ Overlay service started via Flutter call")
                            result.success(true)
                        } else {
                            Log.w("MainActivity", "⚠️ Overlay permission not granted, cannot start service")
                            result.success(false)
                        }
                    } catch (e: Exception) {
                        Log.e("MainActivity", "❌ Error starting service: ${e.message}", e)
                        result.error("SERVICE_START_ERROR", e.message, null)
                    }
                }
                else -> {
                    result.notImplemented()
                }
            }
        }
    }

    private fun checkOverlayPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(this)
        } else {
            true
        }
    }

    private fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
                startActivityForResult(intent, OVERLAY_PERMISSION_REQUEST_CODE)
            }
        }
    }

    private fun showOverlay(tripId: String, fare: String, pickup: String, drop: String, customerName: String) {
        Log.d("MainActivity", "🚀 showOverlay() called")
        Log.d("MainActivity", "   Creating Intent for OverlayService...")
        
        val intent = Intent(this, OverlayService::class.java).apply {
            putExtra("action", "show")
            putExtra("tripId", tripId)
            putExtra("fare", fare)
            putExtra("pickup", pickup)
            putExtra("drop", drop)
            putExtra("customerName", customerName)
        }
        
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Log.d("MainActivity", "   Starting foreground service (Android O+)...")
                startForegroundService(intent)
            } else {
                Log.d("MainActivity", "   Starting service (Android < O)...")
                startService(intent)
            }
            Log.d("MainActivity", "✅ Service started successfully")
        } catch (e: Exception) {
            Log.e("MainActivity", "❌ Error starting service: ${e.message}", e)
        }
    }

    private fun hideOverlay() {
        val intent = Intent(this, OverlayService::class.java).apply {
            putExtra("action", "hide")
        }
        stopService(intent)
    }

    override fun onDestroy() {
        super.onDestroy()
        acceptReceiver?.let {
            try {
                unregisterReceiver(it)
            } catch (e: Exception) {
                // Ignore if already unregistered
            }
        }
    }
}
