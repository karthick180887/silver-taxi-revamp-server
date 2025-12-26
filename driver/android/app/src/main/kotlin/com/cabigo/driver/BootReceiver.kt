package com.cabigo.driver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return

        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != Intent.ACTION_MY_PACKAGE_REPLACED &&
            action != Intent.ACTION_REBOOT
        ) {
            return
        }

        // 1) Start socket foreground service (keeps realtime connection) if driver token exists
        try {
            val prefs = context.getSharedPreferences("FlutterSharedPreferences", Context.MODE_PRIVATE)
            val driverToken = prefs.getString("flutter.driver_token", "") ?: ""

            if (driverToken.isNotBlank()) {
                val socketIntent = Intent(context, SocketForegroundService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(socketIntent)
                } else {
                    context.startService(socketIntent)
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("BootReceiver", "Error starting SocketForegroundService: ${e.message}", e)
        }

        // 2) Start overlay foreground service (floating button) only if overlay permission is granted
        try {
            val canDraw = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(context)
            } else {
                true
            }

            if (canDraw) {
                val overlayIntent = Intent(context, OverlayService::class.java).apply {
                    putExtra("action", "start")
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(overlayIntent)
                } else {
                    context.startService(overlayIntent)
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("BootReceiver", "Error starting OverlayService: ${e.message}", e)
        }
    }
}
