import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'dart:io';

import 'dart:async';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();

  factory NotificationService() => _instance;

  NotificationService._internal();

  FirebaseMessaging get _firebaseMessaging => FirebaseMessaging.instance;


  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  final StreamController<RemoteMessage> _messageStreamController = StreamController<RemoteMessage>.broadcast();
  Stream<RemoteMessage> get onNotificationReceived => _messageStreamController.stream;

  bool _isInitialized = false;
  final ValueNotifier<int> unreadCount = ValueNotifier<int>(0);
  
  // Debug Logs for UI
  final ValueNotifier<List<String>> debugLogs = ValueNotifier<List<String>>([]);

  void _addLog(String log) {
    print(log);
    debugLogs.value = [...debugLogs.value, "${DateTime.now().hour}:${DateTime.now().minute}:${DateTime.now().second} - $log"];
  }

  void updateUnreadCount(int count) {
    unreadCount.value = count;
  }

  void incrementUnreadCount() {
    unreadCount.value++;
  }

  void decrementUnreadCount() {
    if (unreadCount.value > 0) {
      unreadCount.value--;
    }
  }

  Future<void> initialize() async {
    if (_isInitialized) return;
    
    // _firebaseMessaging is now a getter, no need to assign

    // 1. Request Permissions
    await requestPermission();

    // 2. Initialize Local Notifications (for foreground display)
    await _initializeLocalNotifications();

    // 3. Handle Background/Terminated messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // 4. Handle Foreground messages
    
    // Enable System Foreground Notifications (Standard FCM Behavior)
    await _firebaseMessaging.setForegroundNotificationPresentationOptions(
      alert: true, 
      badge: true, 
      sound: true
    );

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _addLog("FCM Received: ${message.data}");
      
      // If the message has a 'notification' payload, the System/SDK (via setForegroundNotificationPresentationOptions)
      // will handle the display. We should NOT duplicate it.
      if (message.notification != null) {
         _addLog("Handled by System (Notification present)");
         return; 
      }

      // Only show local notification for Data-Only messages
      _showLocalNotification(message);
      _messageStreamController.add(message); 
    });

    // 5. Handle Notification Taps (Background/Terminated)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print("FCM Notification Tapped: ${message.data}");
      // TODO: Handle navigation based on message.data['type']
    });

    // 6. Get Token
    String? token = await _firebaseMessaging.getToken();
    _addLog("Token: ${token?.substring(0, 10)}...");
    
    _isInitialized = true;
  }

  Future<String?> getToken() async {
    return await _firebaseMessaging.getToken();
  }

  Future<void> requestPermission() async {
    // Android 13+ Notification Permission
    if (Platform.isAndroid) {
      await Permission.notification.request();
    }

    // iOS Permission
    await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  Future<void> _initializeLocalNotifications() async {
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings();

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(initSettings);

    // Create Channel Explicitly (Android 8.0+)
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel_v2', // id
      'High Importance Notifications', // title
      description: 'This channel is used for important notifications.', // description
      importance: Importance.max,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    RemoteNotification?notification = message.notification;
    AndroidNotification? android = message.notification?.android;

    if (notification != null || message.data.isNotEmpty) {
      // Check for image URL in payload (data > android override)
      String? imageUrl = message.data['image'] ?? android?.imageUrl;
      
      AndroidNotificationDetails? androidDetails;

      if (imageUrl != null && imageUrl.isNotEmpty) {
          try {
              final String bigPicturePath = await _downloadAndSaveFile(imageUrl, 'bigPicture');
              final BigPictureStyleInformation bigPictureStyleInformation =
                  BigPictureStyleInformation(
                    FilePathAndroidBitmap(bigPicturePath),
                    hideExpandedLargeIcon: true,
                    contentTitle: notification?.title ?? message.data['title'],
                    htmlFormatContentTitle: true,
                    summaryText: notification?.body ?? message.data['body'] ?? message.data['message'],
                    htmlFormatSummaryText: true
                  );
              
              androidDetails = AndroidNotificationDetails(
                'high_importance_channel_v2',
                'High Importance Notifications',
                importance: Importance.max,
                priority: Priority.high,
                icon: '@mipmap/ic_launcher',
                styleInformation: bigPictureStyleInformation,
              );
          } catch (e) {
              print("Error downloading notification image: $e");
          }
      }

      // Fallback if no image or error
      androidDetails ??= const AndroidNotificationDetails(
            'high_importance_channel_v2',
            'High Importance Notifications',
            importance: Importance.max,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
      );

      try {
        await _localNotifications.show(
          message.hashCode, // Use message hash which is always valid for standard messages
          notification?.title ?? message.data['title'] ?? 'Notification',
          notification?.body ?? message.data['body'] ?? message.data['message'] ?? '',
           NotificationDetails(
            android: androidDetails,
            iOS: const DarwinNotificationDetails(),
          ),
          payload: message.data.toString(),
        );
      } catch (e) {
        _addLog("Error showing notification: $e");
      }
    }
  }

  Future<String> _downloadAndSaveFile(String url, String fileName) async {
    final Directory directory = await getApplicationDocumentsDirectory();
    final String filePath = '${directory.path}/$fileName';
    final http.Response response = await http.get(Uri.parse(url));
    final File file = File(filePath);
    await file.writeAsBytes(response.bodyBytes);
    return filePath;
  }

  Future<void> showLocalNotification(String title, String body) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'high_importance_channel_v2',
      'High Importance Notifications',
      importance: Importance.max,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );

    const NotificationDetails details = NotificationDetails(android: androidDetails);
    
    await _localNotifications.show(
      DateTime.now().millisecond,
      title,
      body,
      details,
    );
  }
}

// Top-level function for background handling
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print("Handling a background message: ${message.messageId}");

  final FlutterLocalNotificationsPlugin localNotifications = FlutterLocalNotificationsPlugin();
  
  // Initialize for background isolation
  const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
  const InitializationSettings initSettings = InitializationSettings(android: androidSettings);
  await localNotifications.initialize(initSettings);

  // Parse Image
  final notification = message.notification; // Use payload if available
  final android = message.notification?.android;
  String? title = notification?.title ?? message.data['title'];
  String? body = notification?.body ?? message.data['body'] ?? message.data['message'];
  String? imageUrl = message.data['image'] ?? android?.imageUrl;

  // 1. If 'notification' payload is present, the System automatically shows a notification.
  //    To avoid DUPLICATES (System + Local), we return here.
  //    Note: This means background images rely on standard FCM 'image' field support, 
  //    not our manual bigPicture download, unless the backend switches to Data-Only messages.
  if (message.notification != null) {
    print("Background Handler: Notification present, letting System handle it.");
    return;
  }
  
  if (title == null) return; // Nothing to show

  AndroidNotificationDetails? androidDetails;

  if (imageUrl != null && imageUrl.isNotEmpty) {
      try {
          final Directory directory = await getApplicationDocumentsDirectory();
          final String filePath = '${directory.path}/bg_picture_${DateTime.now().millisecondsSinceEpoch}';
          final http.Response response = await http.get(Uri.parse(imageUrl));
          final File file = File(filePath);
          await file.writeAsBytes(response.bodyBytes);

          final BigPictureStyleInformation bigPictureStyleInformation =
              BigPictureStyleInformation(
                FilePathAndroidBitmap(filePath),
                hideExpandedLargeIcon: true,
                contentTitle: title,
                htmlFormatContentTitle: true,
                summaryText: body,
                htmlFormatSummaryText: true
              );
         androidDetails = AndroidNotificationDetails(
            'high_importance_channel_v2', // Updated ID
            'High Importance Notifications',
            importance: Importance.max,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
            styleInformation: bigPictureStyleInformation,
          );
      } catch (e) {
          print("Bg Image Error: $e");
      }
  }

  // Fallback
  androidDetails ??= const AndroidNotificationDetails(
        'high_importance_channel_v2',
        'High Importance Notifications',
        importance: Importance.max,
        priority: Priority.high,
        icon: '@mipmap/ic_launcher',
  );

  await localNotifications.show(
    message.hashCode,
    title,
    body,
    NotificationDetails(android: androidDetails),
    payload: message.data.toString(), // Simplify payload
  );
}
