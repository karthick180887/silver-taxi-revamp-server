import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../core/service_locator.dart';
import 'storage_service.dart';

// Background message handler
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('[FCM] Handling a background message: ${message.messageId}');
  debugPrint('[FCM] Message data: ${message.data}');
  
  // Store the message for processing when app opens
  // Background isolate can't use MethodChannel reliably
  // The native Android service will handle the overlay via FCM data payload directly
  
  if (message.data['type'] == 'NEW_TRIP_OFFER' || message.data['type'] == 'new-booking') {
    debugPrint('[FCM] Background: New trip offer received');
    debugPrint('[FCM] Background: Trip ID: ${message.data['bookingId']}');
    debugPrint('[FCM] Background: Native overlay should be triggered by Android FCM handler');
    
    // Note: MethodChannel doesn't work in background isolate
    // The overlay should be triggered by:
    // 1. Native Android FCM data message handler (in MainActivity/OverlayService)
    // 2. When user opens app, we have pending data via getInitialMessage()
  }
}

class FcmService {
  static final FcmService _instance = FcmService._internal();
  factory FcmService() => _instance;
  FcmService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  
  bool _isInitialized = false;
  String? _lastKnownFcmToken;
  
  // Store pending FCM message for overlay (when app wasn't ready)
  static Map<String, dynamic>? _pendingFcmData;
  static Map<String, dynamic>? get pendingFcmData => _pendingFcmData;
  static void clearPendingFcmData() => _pendingFcmData = null;

  Future<void> init() async {
    if (_isInitialized) return;


    try {
      // 1. Request permissions
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: true,
        provisional: false,
        sound: true,
      );

      debugPrint('[FCM] User granted permission: ${settings.authorizationStatus}');

      // Initialize Local Notifications (works even with denied permission for local notifications)
      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');
      
      const InitializationSettings initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
      );

      await _localNotifications.initialize(
        initializationSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          debugPrint('[FCM] Notification clicked: ${response.payload}');
          // Handle notification tap
        },
      );

      // Set up background handler (only if authorized)
      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

        // Set up foreground handler with error handling
        FirebaseMessaging.onMessage.listen((RemoteMessage message) {
          try {
            debugPrint('[FCM] Got a message whilst in the foreground!');
            debugPrint('[FCM] Message data: ${message.data}');

            if (message.notification != null) {
              debugPrint('[FCM] Message also contained a notification: ${message.notification}');
              
              // Show local notification with error handling
              try {
                _showLocalNotification(message);
              } catch (e) {
                debugPrint('[FCM] Error showing local notification: $e');
              }
            }
            
            // Check for trip offers to trigger overlay
            final messageType = message.data['type']?.toString() ?? '';
            if (messageType == 'NEW_TRIP_OFFER' || messageType == 'new-booking') {
              debugPrint('[FCM] New Trip Offer received via FCM!');
              
              // Create a copy of data to avoid modifying the original
              final processedData = Map<String, dynamic>.from(message.data);
              
              // Normalize the type to what the app expects
              if (messageType == 'new-booking') {
                processedData['type'] = 'NEW_TRIP_OFFER';
              }
              
              // Call OverlayNotificationService via ServiceLocator
              // If not initialized, store pending data
              try {
                final overlayService = ServiceLocator().overlayController;
                overlayService.handleFcmMessage(processedData);
                debugPrint('[FCM] OverlayNotificationService.handleFcmMessage called');
              } catch (e) {
                debugPrint('[FCM] Error calling handleFcmMessage: $e');
                // Store for later processing
                _pendingFcmData = processedData;
              }
              
              // Also update SocketService for in-app UI via ServiceLocator
              try {
                ServiceLocator().socket.handleNotification(processedData);
              } catch (e) {
                debugPrint('[FCM] Error updating SocketService: $e');
              }
            }
          } catch (e, stackTrace) {
            debugPrint('[FCM] ❌ Error processing foreground message: $e');
            debugPrint('[FCM] Stack trace: $stackTrace');
          }
        }, onError: (error) {
          debugPrint('[FCM] ❌ Error in onMessage stream: $error');
        });
        
        // Handle notification tap when app was in background
        FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
          try {
            debugPrint('[FCM] ========================================');
            debugPrint('[FCM] 📲 App opened from notification tap');
            debugPrint('[FCM] Message data: ${message.data}');
            debugPrint('[FCM] ========================================');
            
            final messageType = message.data['type']?.toString() ?? '';
            if (messageType == 'NEW_TRIP_OFFER' || messageType == 'new-booking') {
              // Store pending data for OverlayNotificationService to process
              // when it initializes (after main screen loads)
              _pendingFcmData = Map<String, dynamic>.from(message.data);
              debugPrint('[FCM] Stored pending FCM data for overlay');
              
              // Also inject into socket stream if possible
              try {
                ServiceLocator().socket.handleNotification(message.data);
              } catch (e) {
                debugPrint('[FCM] Error updating SocketService from notification tap: $e');
              }
            }
          } catch (e, stackTrace) {
            debugPrint('[FCM] ❌ Error processing notification tap: $e');
            debugPrint('[FCM] Stack trace: $stackTrace');
          }
        }, onError: (error) {
          debugPrint('[FCM] ❌ Error in onMessageOpenedApp stream: $error');
        });
        
        // Handle notification tap when app was terminated
        RemoteMessage? initialMessage = await _messaging.getInitialMessage();
        if (initialMessage != null) {
          debugPrint('[FCM] ========================================');
          debugPrint('[FCM] 🚀 App launched from notification (was terminated)');
          debugPrint('[FCM] Initial message data: ${initialMessage.data}');
          debugPrint('[FCM] ========================================');
          
          if (initialMessage.data['type'] == 'NEW_TRIP_OFFER' || 
              initialMessage.data['type'] == 'new-booking') {
            _pendingFcmData = initialMessage.data;
            debugPrint('[FCM] Stored initial message for overlay processing');
          }
        }
      } else {
        debugPrint('[FCM] ⚠️ Notification permission denied. Push notifications may not work.');
        debugPrint('[FCM] ⚠️ User can enable notifications in device settings.');
      }

      // Try to get token even if permission is denied (some Android versions allow this)
      // The token might still be useful for backend registration
      try {
        String? token = await _messaging.getToken();
        if (token != null && token.isNotEmpty) {
          _lastKnownFcmToken = token;
          debugPrint('[FCM] Device Token: $token');
          await _syncTokenToBackend(token);
        } else {
          debugPrint('[FCM] ⚠️ Could not get FCM token. Permission may be required.');
        }
      } catch (e) {
        debugPrint('[FCM] ⚠️ Error getting FCM token: $e');
      }
      
      // Keep backend token updated (refresh can happen anytime)
      _messaging.onTokenRefresh.listen((newToken) async {
        _lastKnownFcmToken = newToken;
        debugPrint('[FCM] Token refreshed: $newToken');
        await _syncTokenToBackend(newToken);
      });

      _isInitialized = true;
    } catch (e) {
      debugPrint('[FCM] Error initializing FCM: $e');
    }
  }

  Future<void> _syncTokenToBackend(String fcmToken) async {
    try {
      _lastKnownFcmToken = fcmToken;
      final authToken = await StorageService.getToken();
      if (authToken == null || authToken.isEmpty) {
        debugPrint('[FCM] No auth token yet; skipping backend FCM token update');
        return;
      }

      final result = await ServiceLocator().api.updateFCMToken(
        token: authToken,
        fcmToken: fcmToken,
      );

      if (result.success) {
        debugPrint('[FCM] Backend FCM token updated successfully');
      } else {
        debugPrint('[FCM] Backend FCM token update failed: ${result.body['message'] ?? result.body}');
      }
    } catch (e) {
      debugPrint('[FCM] Error syncing token to backend: $e');
    }
  }

  Future<void> syncTokenToBackendNow() async {
    try {
      final token = _lastKnownFcmToken ?? await _messaging.getToken();
      if (token == null || token.isEmpty) return;

      _lastKnownFcmToken = token;
      await _syncTokenToBackend(token);
    } catch (e) {
      debugPrint('[FCM] Error forcing backend token sync: $e');
    }
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    try {
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      if (notification != null && android != null) {
        final title = notification.title ?? 'New Notification';
        final body = notification.body ?? '';
        
        if (title.isNotEmpty || body.isNotEmpty) {
          await _localNotifications.show(
            notification.hashCode,
            title,
            body,
            const NotificationDetails(
              android: AndroidNotificationDetails(
                'high_importance_channel', // id
                'High Importance Notifications', // title
                channelDescription: 'This channel is used for important notifications.',
                importance: Importance.max,
                priority: Priority.high,
                icon: '@mipmap/ic_launcher',
              ),
            ),
            payload: message.data.toString(),
          );
        }
      }
    } catch (e) {
      debugPrint('[FCM] ❌ Error showing local notification: $e');
    }
  }
  
  Future<String?> getToken() async {
    try {
      final token = await _messaging.getToken();
      if (token != null && token.isNotEmpty) _lastKnownFcmToken = token;
      return token;
    } catch (e) {
      debugPrint('[FCM] ❌ Error getting FCM token: $e');
      return null;
    }
  }
}
