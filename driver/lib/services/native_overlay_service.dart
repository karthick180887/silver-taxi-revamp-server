import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Service to show native Android floating overlay (like Uber Driver).
/// Uses WindowManager and TYPE_APPLICATION_OVERLAY.
class NativeOverlayService {
  static const MethodChannel _channel = MethodChannel('cabigo.driver/overlay');
  static final NativeOverlayService _instance = NativeOverlayService._internal();
  factory NativeOverlayService() => _instance;

  // Stream controller for overlay accept events.
  final _acceptController = StreamController<String>.broadcast();
  Stream<String> get onAccept => _acceptController.stream;

  bool _handlerInitialized = false;
  bool _isServiceRunning = false;
  
  /// Check if the overlay service is currently running
  bool get isServiceRunning => _isServiceRunning;

  NativeOverlayService._internal() {
    // Initialize method call handler once.
    if (!_handlerInitialized) {
      _channel.setMethodCallHandler((call) async {
        if (call.method == 'onOverlayAccept') {
          String? tripId;
          if (call.arguments is Map) {
            tripId = (call.arguments as Map)['tripId']?.toString();
          } else {
            tripId = call.arguments?.toString();
          }

          if (tripId != null && tripId.isNotEmpty) {
            debugPrint('[NativeOverlay] Accept event received from native: $tripId');
            _acceptController.add(tripId);
          } else {
            debugPrint('[NativeOverlay] Accept event received but tripId is empty or null');
          }
        }
      });
      _handlerInitialized = true;
      debugPrint('[NativeOverlay] Method call handler initialized');
    }
  }

  /// Check if overlay permission is granted.
  Future<bool> checkOverlayPermission() async {
    try {
      final result = await _channel.invokeMethod<bool>('checkOverlayPermission');
      return result ?? false;
    } catch (e) {
      debugPrint('[NativeOverlay] Error checking permission: $e');
      return false;
    }
  }

  /// Request overlay permission (opens system settings).
  Future<void> requestOverlayPermission() async {
    try {
      await _channel.invokeMethod('requestOverlayPermission');
    } catch (e) {
      debugPrint('[NativeOverlay] Error requesting permission: $e');
    }
  }

  /// Show floating overlay with trip details.
  Future<String?> showOverlay({
    required String tripId,
    required double fare,
    required String pickup,
    required String drop,
    required String customerName,
  }) async {
    try {
      debugPrint('[NativeOverlay] Attempting to show native overlay');
      debugPrint('[NativeOverlay] Trip ID: $tripId, Fare: $fare');
      debugPrint('[NativeOverlay] Pickup: $pickup, Drop: $drop');

      final result = await _channel.invokeMethod<bool>('showOverlay', {
        'tripId': tripId,
        'fare': fare.toStringAsFixed(2),
        'pickup': pickup,
        'drop': drop,
        'customerName': customerName,
      });

      if (result == true) {
        debugPrint('[NativeOverlay] Native overlay show command sent successfully');
        return tripId;
      } else {
        debugPrint('[NativeOverlay] Native overlay show returned false');
        return null;
      }
    } catch (e, stackTrace) {
      debugPrint('[NativeOverlay] Error showing overlay: $e');
      debugPrint('[NativeOverlay] Stack trace: $stackTrace');
      return null;
    }
  }

  /// Handle accept from native overlay.
  void handleAccept(String tripId) {
    debugPrint('[NativeOverlay] Accept button pressed for trip: $tripId');
    _acceptController.add(tripId);
  }

  /// Hide the floating overlay.
  Future<bool> hideOverlay() async {
    try {
      final result = await _channel.invokeMethod<bool>('hideOverlay');
      return result ?? false;
    } catch (e) {
      debugPrint('[NativeOverlay] Error hiding overlay: $e');
      return false;
    }
  }

  /// Start the overlay service automatically (call this when app opens).
  /// This keeps the service running in the background even when app is closed.
  Future<bool> startService() async {
    if (_isServiceRunning) {
      debugPrint('[NativeOverlay] Service already running, skipping start');
      return true;
    }
    
    try {
      debugPrint('[NativeOverlay] Starting overlay service automatically...');
      final result = await _channel.invokeMethod<bool>('startService');
      if (result == true) {
        _isServiceRunning = true;
        debugPrint('[NativeOverlay] Overlay service started successfully');
      } else {
        debugPrint('[NativeOverlay] Overlay service start returned false');
      }
      return result ?? false;
    } on MissingPluginException catch (e) {
      debugPrint('[NativeOverlay] MissingPluginException - app may have been killed: $e');
      _isServiceRunning = false;
      return false;
    } catch (e) {
      debugPrint('[NativeOverlay] Error starting service: $e');
      _isServiceRunning = false;
      return false;
    }
  }
}
