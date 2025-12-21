import 'dart:async';
import 'package:flutter/widgets.dart';
import '../services/storage_service.dart';
import '../core/service_locator.dart';
import '../services/fcm_service.dart';

enum AppState { splash, unauthenticated, authenticated }

class AppController extends ChangeNotifier with WidgetsBindingObserver {
  AppState _state = AppState.splash;
  String? _authToken;
  String? _driverId;
  bool _pendingOverlayPermission = false;
  
  // Getters
  AppState get state => _state;
  String? get token => _authToken;
  String? get driverId => _driverId;
  bool get isAuthenticated => _state == AppState.authenticated;

  AppController() {
    WidgetsBinding.instance.addObserver(this);
    _initApp();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    ServiceLocator().dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      debugPrint('[AppController] 📱 App resumed');
      
      // Always check overlay service on resume if authenticated
      if (_state == AppState.authenticated) {
        debugPrint('[AppController] 🔄 Checking overlay service status...');
        Future.delayed(const Duration(milliseconds: 500), () {
          _ensureOverlayServiceRunning();
        });
      }
      
      // If we were waiting for permission, check again
      if (_pendingOverlayPermission) {
        debugPrint('[AppController] 🔄 App resumed - rechecking overlay permission...');
        Future.delayed(const Duration(milliseconds: 500), () {
          _checkOverlayPermission();
        });
      }
    }
  }

  Future<void> _ensureOverlayServiceRunning() async {
    try {
      final nativeOverlay = ServiceLocator().nativeOverlay;
      
      // Check if service is running
      if (!nativeOverlay.isServiceRunning) {
        debugPrint('[AppController] ⚠️ Overlay service not running, starting...');
        final hasPermission = await nativeOverlay.checkOverlayPermission();
        
        if (hasPermission) {
          await _startOverlayService();
        } else {
          debugPrint('[AppController] ⚠️ Permission not granted, requesting...');
          _pendingOverlayPermission = true;
          await nativeOverlay.requestOverlayPermission();
          await Future.delayed(const Duration(seconds: 1));
          await _retryOverlayServiceStart();
        }
      } else {
        debugPrint('[AppController] ✅ Overlay service is already running');
      }
    } catch (e) {
      debugPrint('[AppController] ❌ Error ensuring overlay service: $e');
    }
  }

  Future<void> _initApp() async {
    // 1. Check Auth (Fastest)
    await _checkAuth();
    
    // 2. If Auth, Init Services
    if (_state == AppState.authenticated) {
      await _initServices();
    }
  }

  Future<void> _checkAuth() async {
    try {
      final token = await StorageService.getToken();
      final dId = await StorageService.getDriverId();
      
      if (token != null && token.isNotEmpty && dId != null && dId.isNotEmpty) {
        _authToken = token;
        _driverId = dId;
        _state = AppState.authenticated;
      } else {
        _state = AppState.unauthenticated;
      }
    } catch (e) {
      debugPrint('[AppController] Auth check failed: $e');
      _state = AppState.unauthenticated;
    }
    notifyListeners();
  }

  Future<void> login(String token, String driverId) async {
    _authToken = token;
    _driverId = driverId;
    _state = AppState.authenticated;
    notifyListeners();
    
    // Init services after login
    await _initServices();
  }

  Future<void> logout() async {
    await StorageService.clear();
    ServiceLocator().dispose();
    _authToken = null;
    _driverId = null;
    _state = AppState.unauthenticated;
    notifyListeners();
  }

  Future<void> _initServices() async {
    if (_authToken == null) {
      debugPrint('[AppController] ⚠️ Cannot init services: No auth token');
      return;
    }
    
    debugPrint('[AppController] ========================================');
    debugPrint('[AppController] 🚀 INITIALIZING SERVICES');
    debugPrint('[AppController] ========================================');
    final sl = ServiceLocator();
    
    try {
      // 1. Socket (non-blocking)
      debugPrint('[AppController] 1️⃣ Initializing Socket Service...');
      sl.socket.init(_authToken!);
      
      // 2. Notifications (non-blocking)
      debugPrint('[AppController] 2️⃣ Initializing Notification Service...');
      sl.notifications.init(_authToken!);
      
      // 3. Overlay Permission & Service (blocking - important!)
      debugPrint('[AppController] 3️⃣ Initializing Overlay Service...');
      await _checkOverlayPermission();
      
      // 4. Pending FCM Data
      debugPrint('[AppController] 4️⃣ Processing pending FCM data...');
      _processPendingFcm();
      
      debugPrint('[AppController] ========================================');
      debugPrint('[AppController] ✅ SERVICES INITIALIZED');
      debugPrint('[AppController] ========================================');
    } catch (e) {
      debugPrint('[AppController] ❌ Error initializing services: $e');
      // Still try to start overlay service even if other services fail
      await _ensureOverlayServiceRunning();
    }
  }
  
  Future<void> _checkOverlayPermission() async {
    try {
      final nativeOverlay = ServiceLocator().nativeOverlay;
      final hasPermission = await nativeOverlay.checkOverlayPermission();
      
      if (!hasPermission) {
        debugPrint('[AppController] ⚠️ Overlay permission not granted');
        debugPrint('[AppController] 📱 Requesting Overlay Permission...');
        _pendingOverlayPermission = true;
        await nativeOverlay.requestOverlayPermission();
        
        // Wait a bit for user to grant permission, then check again
        await Future.delayed(const Duration(seconds: 1));
        await _retryOverlayServiceStart();
      } else {
        debugPrint('[AppController] ✅ Overlay permission granted');
        await _startOverlayService();
      }
    } catch (e) {
      debugPrint('[AppController] ❌ Error checking overlay permission: $e');
      // Retry after a delay even on error
      await Future.delayed(const Duration(seconds: 2));
      await _retryOverlayServiceStart();
    }
  }

  Future<void> _retryOverlayServiceStart() async {
    try {
      final nativeOverlay = ServiceLocator().nativeOverlay;
      final hasPermission = await nativeOverlay.checkOverlayPermission();
      
      if (hasPermission) {
        debugPrint('[AppController] ✅ Permission granted on retry, starting service...');
        await _startOverlayService();
      } else {
        debugPrint('[AppController] ⚠️ Permission still not granted, will retry on app resume');
        _pendingOverlayPermission = true;
      }
    } catch (e) {
      debugPrint('[AppController] ❌ Error in retry: $e');
    }
  }

  Future<void> _startOverlayService() async {
    try {
      final nativeOverlay = ServiceLocator().nativeOverlay;
      debugPrint('[AppController] 🚀 Starting Overlay Service...');
      final started = await nativeOverlay.startService();
      
      if (started) {
        debugPrint('[AppController] ✅✅✅ Overlay Service started successfully!');
        _pendingOverlayPermission = false;
      } else {
        debugPrint('[AppController] ⚠️ Overlay Service start returned false, will retry...');
        // Retry after delay
        await Future.delayed(const Duration(seconds: 2));
        await _retryOverlayServiceStart();
      }
    } catch (e) {
      debugPrint('[AppController] ❌ Error starting overlay service: $e');
      // Retry after delay
      await Future.delayed(const Duration(seconds: 2));
      await _retryOverlayServiceStart();
    }
  }
  
  void _processPendingFcm() {
    final pendingData = FcmService.pendingFcmData;
    if (pendingData != null) {
      debugPrint('[AppController] 📨 Processing pending FCM data...');
      ServiceLocator().overlayController.handleFcmMessage(pendingData);
      FcmService.clearPendingFcmData();
    }
  }

  /// Called by MainScreen when it mounts
  void onMainScreenMounted(BuildContext context) {
    // Init Overlay Controller with Context
    ServiceLocator().overlayController.init(
      _authToken!, 
      ServiceLocator().trip, 
      context
    );
  }
}
