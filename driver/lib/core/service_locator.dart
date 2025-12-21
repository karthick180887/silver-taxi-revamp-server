import 'package:flutter/foundation.dart';
import '../api_client.dart';
import '../services/socket_service.dart';
import '../services/persistent_notification_service.dart';
import '../services/overlay_notification_service.dart';
import '../services/native_overlay_service.dart';
import '../services/trip_service.dart';

class ServiceLocator {
  static final ServiceLocator _instance = ServiceLocator._internal();
  factory ServiceLocator() => _instance;
  ServiceLocator._internal();

  // Lazy singletons
  late final DriverApiClient _apiClient = DriverApiClient();
  late final SocketService _socketService = SocketService();
  late final PersistentNotificationService _notificationService = PersistentNotificationService();
  late final TripService _tripService = TripService(apiClient: _apiClient);
  
  // Overlay services
  late final NativeOverlayService _nativeOverlay = NativeOverlayService();
  late final OverlayNotificationService _overlayController = OverlayNotificationService();

  // Getters
  DriverApiClient get api => _apiClient;
  SocketService get socket => _socketService;
  PersistentNotificationService get notifications => _notificationService;
  TripService get trip => _tripService;
  NativeOverlayService get nativeOverlay => _nativeOverlay;
  OverlayNotificationService get overlayController => _overlayController;
  
  void dispose() {
    debugPrint('[ServiceLocator] Disposing all services...');
    _socketService.dispose();
    _notificationService.dispose();
    _overlayController.dispose();
    // Native overlay should NOT be stopped on app dispose usually
  }
}
