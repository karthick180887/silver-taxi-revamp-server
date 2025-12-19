import 'package:firebase_core/firebase_core.dart';
import 'overlay_notification_service.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'socket_service.dart';

// Background message handler
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('[FCM] Handling a background message: ${message.messageId}');
  debugPrint('[FCM] Message data: ${message.data}');
  
  // If it's a new trip offer, we might want to show the overlay even in background
  if (message.data['type'] == 'NEW_TRIP_OFFER') {
    // We can't easily show the full overlay from background isolate without more setup,
    // but the system notification will be shown automatically if notification payload is present.
    // Or we can use local notifications.
  }
}

class FcmService {
  static final FcmService _instance = FcmService._internal();
  factory FcmService() => _instance;
  FcmService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  
  bool _isInitialized = false;

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

             // Parse nested JSON strings if present (fixed backend logic)
             if (message.data['data'] is String) {
                try {
                  // data field might be JSON stringified booking object
                   // Or it might be inside 'booking' key
                   debugPrint('[FCM] Parsing nested data JSON...');
                } catch (e) {
                   debugPrint('[FCM] Error parsing data JSON: $e');
                }
             }

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
             
             // SIMPLEST FIX: Just pass the data through. 
             // SocketService logic might need to be robust to String values if it expects Maps.
             // But let's try injecting what we have.
             
             // Actually, calling OverlayNotificationService is good enough for the pop-up.
             OverlayNotificationService().handleFcmMessage(message.data);
             
             // BUT to update the "Home Screen" list or state, we invoke SocketService
             // Note: SocketService expects Map<String, dynamic>.
             // FCM provides Map<String, dynamic>.
             SocketService().handleNotification(message.data);
          }
        });
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
