import 'package:firebase_core/firebase_core.dart';
import 'overlay_notification_service.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../core/service_locator.dart';
import 'socket_service.dart';

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

        // Set up foreground handler
        FirebaseMessaging.onMessage.listen((RemoteMessage message) {
          debugPrint('[FCM] Got a message whilst in the foreground!');
          debugPrint('[FCM] Message data: ${message.data}');

          if (message.notification != null) {
            debugPrint('[FCM] Message also contained a notification: ${message.notification}');
            
            // Show local notification
            _showLocalNotification(message);
          }
          
          // Check for trip offers to trigger overlay
          if (message.data['type'] == 'NEW_TRIP_OFFER' || message.data['type'] == 'new-booking') {
             debugPrint('[FCM] New Trip Offer received via FCM!');
             
             // Normalize the type to what the app expects
             if (message.data['type'] == 'new-booking') {
               message.data['type'] = 'NEW_TRIP_OFFER';
             }
             
             // Note: FCM data values are always strings. Actual parsing happens in handleFcmMessage.

             // Inject into SocketService so the app handles it exactly like a socket event
             // This updates the UI (New Request Screen) immediately
             debugPrint('[FCM] Injecting into SocketService stream...');
             
             // Ensure we pass the map with 'type' and 'data' keys as expected by SocketService
             // If the backend sends flattened data, we might need to restructure it
             // Backend (New) sends: { ids:..., data: { title:..., type:..., booking: "{...}" } }
             // SocketService expects: { type: 'NEW_TRIP_OFFER', data: { ...booking... } }
             
             Map<String, dynamic> socketEvent = {};
             socketEvent['type'] = 'NEW_TRIP_OFFER';
             
             // Extract booking data
             if (message.data.containsKey('booking')) {
                // If it's a JSON string, decode it?
                // Actually SocketService doesn't decode, it expects a Map.
                // But FCM data values are ALWAYS Strings.
                // So checking if we need to parse.
                // Since I updated backend to JSON.stringify objects, we DO need to parse here?
                // Dart's Message.data values are strings.
                
                // Let's rely on OverlayNotificationService for the overlay part, 
                // but for the In-App UI (SocketStream), we need a Map.
             }
             
             // Call OverlayNotificationService via ServiceLocator
             // If not initialized, store pending data
             try {
               final overlayService = ServiceLocator().overlayController;
               overlayService.handleFcmMessage(message.data);
               debugPrint('[FCM] OverlayNotificationService.handleFcmMessage called');
             } catch (e) {
               debugPrint('[FCM] Error calling handleFcmMessage: $e');
               // Store for later processing
               _pendingFcmData = message.data;
             }
             
             // Also update SocketService for in-app UI via ServiceLocator
             ServiceLocator().socket.handleNotification(message.data);
          }
        });
        
        // Handle notification tap when app was in background
        FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
          debugPrint('[FCM] ========================================');
          debugPrint('[FCM] 📲 App opened from notification tap');
          debugPrint('[FCM] Message data: ${message.data}');
          debugPrint('[FCM] ========================================');
          
          if (message.data['type'] == 'NEW_TRIP_OFFER' || message.data['type'] == 'new-booking') {
            // Store pending data for OverlayNotificationService to process
            // when it initializes (after main screen loads)
            _pendingFcmData = message.data;
            debugPrint('[FCM] Stored pending FCM data for overlay');
            
            // Also inject into socket stream if possible
            try {
              ServiceLocator().socket.handleNotification(message.data);
            } catch (_) {}
          }
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
        if (token != null) {
          debugPrint('[FCM] Device Token: $token');
        } else {
          debugPrint('[FCM] ⚠️ Could not get FCM token. Permission may be required.');
        }
      } catch (e) {
        debugPrint('[FCM] ⚠️ Error getting FCM token: $e');
      }
      
      _isInitialized = true;
    } catch (e) {
      debugPrint('[FCM] Error initializing FCM: $e');
    }
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    RemoteNotification? notification = message.notification;
    AndroidNotification? android = message.notification?.android;

    if (notification != null && android != null) {
      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
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
  
  Future<String?> getToken() async {
    return await _messaging.getToken();
  }
}
