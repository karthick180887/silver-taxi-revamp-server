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
    if (state == AppLifecycleState.resumed && _pendingOverlayPermission) {
      debugPrint('[AppController] 📱 App resumed - checking overlay permission...');
      _pendingOverlayPermission = false;
      _checkOverlayPermission();
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
    if (_authToken == null) return;
    
    debugPrint('[AppController] 🚀 Initializing Services...');
    final sl = ServiceLocator();
    
    // 1. Socket
    sl.socket.init(_authToken!);
    
    // 2. Notifications
    sl.notifications.init(_authToken!);
    
    // 3. Overlay Permission & Service
    await _checkOverlayPermission();
    
    // 4. Pending FCM Data
    _processPendingFcm();
  }
  
  Future<void> _checkOverlayPermission() async {
    final nativeOverlay = ServiceLocator().nativeOverlay;
    final hasPermission = await nativeOverlay.checkOverlayPermission();
    
    if (!hasPermission) {
      debugPrint('[AppController] ⚠️ Requesting Overlay Permission...');
      _pendingOverlayPermission = true;
      await nativeOverlay.requestOverlayPermission();
    } else {
      debugPrint('[AppController] ✅ Starting Overlay Service...');
      await nativeOverlay.startService();
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
