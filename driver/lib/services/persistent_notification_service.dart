import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'socket_service.dart';
import 'trip_service.dart';

/// Persistent notification service that shows trip availability to drivers.
class PersistentNotificationService {
  static final PersistentNotificationService _instance = PersistentNotificationService._internal();
  factory PersistentNotificationService() => _instance;
  PersistentNotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications = FlutterLocalNotificationsPlugin();
  final TripService _tripService = TripService();
  StreamSubscription? _socketSubscription;
  String? _currentToken;
  int _currentTripCount = 0;
  bool _isInitialized = false;

  /// Initialize the notification service.
  Future<void> init(String token) async {
    if (_isInitialized && _currentToken == token) {
      return; // Already initialized with same token.
    }

    _currentToken = token;

    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
    );

    await _notifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Create notification channels.
    const AndroidNotificationChannel persistentChannel = AndroidNotificationChannel(
      'trip_availability_channel',
      'Trip Availability',
      description: 'Shows available trip requests',
      importance: Importance.low,
      showBadge: false,
      enableVibration: false,
      playSound: false,
    );

    const AndroidNotificationChannel tripOfferChannel = AndroidNotificationChannel(
      'trip_offer_channel',
      'New Trip Offers',
      description: 'Notifications for new trip requests',
      importance: Importance.high,
      showBadge: true,
      enableVibration: true,
      playSound: true,
    );

    final androidPlugin =
        _notifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();

    await androidPlugin?.createNotificationChannel(persistentChannel);
    await androidPlugin?.createNotificationChannel(tripOfferChannel);

    _listenToSocketEvents();
    _startPeriodicUpdates();

    _isInitialized = true;

    debugPrint('[PersistentNotification] Service initialized');
    debugPrint('[PersistentNotification] Socket connected: ${SocketService().isConnected}');
    debugPrint('[PersistentNotification] Socket authenticated: ${SocketService().isAuthenticated}');
  }

  void _listenToSocketEvents() {
    _socketSubscription?.cancel();

    debugPrint('[PersistentNotification] Setting up bookingUpdateStream listener');
    debugPrint('[PersistentNotification] Socket connected: ${SocketService().isConnected}');
    debugPrint('[PersistentNotification] Socket authenticated: ${SocketService().isAuthenticated}');

    _socketSubscription = SocketService().bookingUpdateStream.listen((event) {
      final type = event['type']?.toString() ?? '';
      debugPrint('[PersistentNotification] Socket event type: $type');

      switch (type) {
        case 'NEW_TRIP_OFFER':
          _showIndividualTripNotification(event);
          _updateTripCount();
          break;
        case 'TRIP_ACCEPTED':
        case 'TRIP_CANCELLED':
          _updateTripCount();
          break;
      }
    });

    SocketService().notificationStream.listen((data) {
      final type = data['type']?.toString() ?? '';
      if (type == 'TRIP_ACCEPTED') {
        debugPrint('[PersistentNotification] Trip accepted by another driver');
        _updateTripCount();
      }
    });
  }

  void _startPeriodicUpdates() {
    Timer.periodic(const Duration(seconds: 30), (timer) {
      if (_currentToken != null) {
        _updateTripCount();
      }
    });
  }

  Future<void> _updateTripCount() async {
    if (_currentToken == null) return;

    try {
      final counts = await _tripService.getTripCounts(_currentToken!);
      final newCount = counts['offers'] ?? 0;

      if (newCount != _currentTripCount) {
        _currentTripCount = newCount;
        await _updateNotification();
      }
    } catch (e) {
      debugPrint('[PersistentNotification] Error updating trip count: $e');
    }
  }

  Future<void> _updateNotification() async {
    if (_currentToken == null) return;

    if (_currentTripCount > 0) {
      await _showNotification(_currentTripCount);
    } else {
      await _hideNotification();
    }
  }

  Future<void> _showNotification(int tripCount) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'trip_availability_channel',
      'Trip Availability',
      channelDescription: 'Shows available trip requests',
      importance: Importance.low,
      priority: Priority.low,
      ongoing: true,
      autoCancel: false,
      showWhen: false,
      icon: '@mipmap/ic_launcher',
      largeIcon: DrawableResourceAndroidBitmap('@mipmap/ic_launcher'),
    );

    const NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
    );

    final title = tripCount == 1 ? '1 Trip Available' : '$tripCount Trips Available';
    final body = tripCount == 1 ? 'Tap to view trip request' : 'Tap to view trip requests';

    await _notifications.show(
      1001,
      title,
      body,
      notificationDetails,
    );

    debugPrint('[PersistentNotification] Showing notification: $tripCount trips');
  }

  Future<void> _hideNotification() async {
    await _notifications.cancel(1001);
    debugPrint('[PersistentNotification] Hiding notification - no trips');
  }

  /// Show individual notification for each new trip offer with sound.
  Future<void> _showIndividualTripNotification(Map<String, dynamic> event) async {
    debugPrint('[PersistentNotification] ===== SHOWING INDIVIDUAL TRIP NOTIFICATION =====');
    debugPrint('[PersistentNotification] Event: $event');

    try {
      final eventData = event['data'];
      debugPrint('[PersistentNotification] Event data type: ${eventData.runtimeType}');
      debugPrint('[PersistentNotification] Event data: $eventData');

      if (eventData is! Map<String, dynamic>) {
        debugPrint('[PersistentNotification] Invalid event data for individual notification - not a Map');
        return;
      }

      final bookingId = eventData['bookingId']?.toString() ??
          eventData['BookingID']?.toString() ??
          '';
      
      // Handle both formats:
      // 1. Simple strings: pickup/drop (from database)
      // 2. Object format: PickupLocation/DropLocation with address field
      final pickupLocation = eventData['PickupLocation'] ?? eventData['pickupLocation'];
      final dropLocation = eventData['DropLocation'] ?? eventData['dropLocation'];
      
      // Also check for simple string fields (backend sends 'pickup' and 'drop')
      final pickupString = eventData['pickup']?.toString();
      final dropString = eventData['drop']?.toString();
      
      final estimatedFare = eventData['EstimatedFare'] ?? 
          eventData['estimatedFare'] ?? 
          eventData['estimatedAmount'] ?? 
          eventData['finalAmount'] ?? 
          0;

      String pickupAddress = 'Unknown location';
      if (pickupString != null && pickupString.isNotEmpty) {
        // Simple string format from backend
        pickupAddress = pickupString;
      } else if (pickupLocation is Map) {
        // Object format with address field
        pickupAddress = pickupLocation['address']?.toString() ??
            pickupLocation['Address']?.toString() ??
            'Unknown location';
      } else if (pickupLocation is String && pickupLocation.isNotEmpty) {
        pickupAddress = pickupLocation;
      }

      String dropAddress = 'Unknown location';
      if (dropString != null && dropString.isNotEmpty) {
        // Simple string format from backend
        dropAddress = dropString;
      } else if (dropLocation is Map) {
        // Object format with address field
        dropAddress = dropLocation['address']?.toString() ??
            dropLocation['Address']?.toString() ??
            'Unknown location';
      } else if (dropLocation is String && dropLocation.isNotEmpty) {
        dropAddress = dropLocation;
      }

      final fareText = estimatedFare != null && estimatedFare != 0
          ? 'Rs ${estimatedFare.toStringAsFixed(0)}'
          : 'Check fare';

      final AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
        'trip_offer_channel',
        'New Trip Offers',
        channelDescription: 'Notifications for new trip requests',
        importance: Importance.high,
        priority: Priority.high,
        ongoing: false,
        autoCancel: true,
        showWhen: true,
        enableVibration: true,
        playSound: true,
        icon: '@mipmap/ic_launcher',
        largeIcon: DrawableResourceAndroidBitmap('@mipmap/ic_launcher'),
        styleInformation: BigTextStyleInformation(
          'Pickup: $pickupAddress\nDrop: $dropAddress\nFare: $fareText',
          contentTitle: 'New Trip Offer',
          summaryText: 'Tap to view details',
        ),
      );

      final NotificationDetails notificationDetails = NotificationDetails(
        android: androidDetails,
      );

      final notificationId =
          bookingId.isNotEmpty ? bookingId.hashCode.abs() : DateTime.now().millisecondsSinceEpoch % 100000;

      debugPrint('[PersistentNotification] About to show notification with:');
      debugPrint('[PersistentNotification]   - ID: $notificationId');
      debugPrint('[PersistentNotification]   - Title: New Trip Offer');
      debugPrint('[PersistentNotification]   - Body: Pickup: $pickupAddress');
      debugPrint('[PersistentNotification]   - Channel: trip_offer_channel (high importance, sound enabled)');

      await _notifications.show(
        notificationId,
        'New Trip Offer',
        'Pickup: $pickupAddress',
        notificationDetails,
        payload: bookingId,
      );

      debugPrint('[PersistentNotification] Individual trip notification shown successfully.');
      debugPrint('[PersistentNotification] Booking ID: $bookingId');
      debugPrint('[PersistentNotification] Pickup: $pickupAddress');
      debugPrint('[PersistentNotification] Drop: $dropAddress');
      debugPrint('[PersistentNotification] Fare: $fareText');
    } catch (e) {
      debugPrint('[PersistentNotification] Error showing individual notification: $e');
    }
  }

  void _onNotificationTapped(NotificationResponse response) {
    debugPrint('[PersistentNotification] Notification tapped: ${response.payload}');
  }

  /// Manually refresh trip count (call when app comes to foreground).
  Future<void> refresh() async {
    await _updateTripCount();
  }

  void dispose() {
    _socketSubscription?.cancel();
    _notifications.cancel(1001);
    _currentToken = null;
    _isInitialized = false;
  }
}
