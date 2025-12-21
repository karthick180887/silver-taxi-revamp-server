import 'package:permission_handler/permission_handler.dart';
import 'package:flutter/material.dart';

/// Service to handle app permissions (location, overlay, etc.)
class PermissionService {
  static final PermissionService _instance = PermissionService._internal();
  factory PermissionService() => _instance;
  PermissionService._internal();

  /// Request all required permissions for the driver app
  /// Returns a map of permission statuses
  Future<Map<Permission, PermissionStatus>> requestAllPermissions() async {
    final permissions = [
      Permission.location,
      Permission.locationWhenInUse,
      Permission.systemAlertWindow,
      // Android 13+ runtime notifications permission
      Permission.notification,
    ];

    final statuses = await permissions.request();
    return statuses;
  }

  /// Check if overlay permission is granted
  Future<bool> isOverlayPermissionGranted() async {
    return await Permission.systemAlertWindow.isGranted;
  }

  /// Request overlay permission specifically
  /// On Android, SYSTEM_ALERT_WINDOW cannot be requested via normal dialog
  /// It must be opened in system settings
  Future<bool> requestOverlayPermission() async {
    // Check current status first
    final status = await Permission.systemAlertWindow.status;
    
    if (status.isGranted) {
      return true;
    }
    
    // SYSTEM_ALERT_WINDOW cannot be requested via .request()
    // We need to open system settings directly
    debugPrint('[PermissionService] Opening system settings for overlay permission');
    final opened = await openAppSettings();
    
    if (opened) {
      // Wait a bit and check again (user might have granted it)
      await Future.delayed(const Duration(seconds: 1));
      final newStatus = await Permission.systemAlertWindow.status;
      return newStatus.isGranted;
    }
    
    return false;
  }

  /// Check if location permission is granted
  Future<bool> isLocationPermissionGranted() async {
    final status = await Permission.location.status;
    return status.isGranted;
  }

  /// Request location permission
  Future<bool> requestLocationPermission() async {
    final status = await Permission.location.request();
    return status.isGranted;
  }

  /// Show permission dialog explaining why permissions are needed
  static Future<bool> showPermissionDialog(BuildContext context) async {
    return await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Permissions Required'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'This app needs the following permissions:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            Text('📍 Location: To show your location on maps and track trips'),
            SizedBox(height: 8),
            Text('🔔 Overlay: To show trip notifications over other apps'),
            SizedBox(height: 8),
            Text('🔔 Notifications: To show trip alerts when the app is closed'),
            SizedBox(height: 16),
            Text(
              'Please grant these permissions to use all app features.',
              style: TextStyle(fontStyle: FontStyle.italic),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Grant Permissions'),
          ),
        ],
      ),
    ) ?? false;
  }

  /// Request permissions with user-friendly dialog
  Future<Map<String, bool>> requestPermissionsWithDialog(BuildContext context) async {
    // Show explanation dialog first
    final shouldRequest = await showPermissionDialog(context);
    if (!shouldRequest) {
      return {
        'location': false,
        'overlay': false,
      };
    }

    // Request location permission
    final locationGranted = await requestLocationPermission();

    // Request notification permission (Android 13+)
    bool notificationGranted = true;
    try {
      final status = await Permission.notification.request();
      notificationGranted = status.isGranted;
    } catch (_) {}

    // Request overlay permission (opens system settings)
    bool overlayGranted = await isOverlayPermissionGranted();
    if (!overlayGranted && context.mounted) {
      // Show dialog explaining overlay permission first
      final shouldOpenSettings = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.notifications_active, color: Colors.orange),
              SizedBox(width: 8),
              Text('Overlay Permission'),
            ],
          ),
          content: const Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'To show trip notifications over other apps (like Uber Driver), we need overlay permission.',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 16),
              Text(
                'This will:',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              SizedBox(height: 8),
              Text('• Show trip requests even when using other apps'),
              Text('• Display notifications on top of your screen'),
              Text('• Allow you to accept trips quickly'),
              SizedBox(height: 16),
              Text(
                'You\'ll be taken to system settings to enable this.',
                style: TextStyle(fontStyle: FontStyle.italic, color: Colors.grey),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Skip'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
              ),
              child: const Text('Open Settings'),
            ),
          ],
        ),
      ) ?? false;
      
      if (shouldOpenSettings) {
        overlayGranted = await requestOverlayPermission();
        
        // Check again after user returns from settings
        if (context.mounted && !overlayGranted) {
          // Wait a moment for user to return and check again
          await Future.delayed(const Duration(milliseconds: 500));
          overlayGranted = await isOverlayPermissionGranted();
          
          if (overlayGranted && context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('✅ Overlay permission granted!'),
                backgroundColor: Colors.green,
                duration: Duration(seconds: 2),
              ),
            );
          } else if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('⚠️ Overlay permission not granted. Trip notifications may not appear over other apps.'),
                duration: Duration(seconds: 4),
              ),
            );
          }
        }
      }
    }

    return {
      'location': locationGranted,
      'overlay': overlayGranted,
      'notifications': notificationGranted,
    };
  }
}
