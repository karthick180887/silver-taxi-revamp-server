// DISABLED: Background service has Android 14+ foreground service type issues
// TODO: Fix foreground service type declaration for flutter_background_service  
// 
// This file is temporarily disabled. Once flutter_background_service is fixed
// for Android 14+ foreground service types, uncomment the implementation.

import 'package:flutter/foundation.dart';

/// Placeholder class - functionality disabled until Android 14+ compatibility fixed
class BackgroundServiceManager {
  static final BackgroundServiceManager _instance = BackgroundServiceManager._internal();
  factory BackgroundServiceManager() => _instance;
  BackgroundServiceManager._internal();

  Future<void> initialize() async {
    debugPrint('[BackgroundService] DISABLED - Android 14+ foreground service type issue');
  }

  Future<void> startService(String token) async {
    debugPrint('[BackgroundService] DISABLED - startService called but feature disabled');
  }

  Future<void> stopService() async {
    debugPrint('[BackgroundService] DISABLED - stopService called but feature disabled');
  }

  Future<bool> isRunning() async {
    return false;
  }

  void updateNotification(String title, String content) {
    // No-op
  }
}
