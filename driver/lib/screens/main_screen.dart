import 'package:flutter/material.dart';
import '../services/socket_service.dart';
import '../services/persistent_notification_service.dart';
import '../services/overlay_notification_service.dart';
import '../services/native_overlay_service.dart';
import '../services/trip_service.dart';
import 'home_tab.dart';
import 'notification_tab.dart';
import 'menu_tab.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key, required this.token, required this.driverId});
  final String token;
  final String driverId;

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  late final List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    
    // Initialize Socket.IO
    SocketService().init(widget.token);
    
    // Initialize persistent notification service (system tray notification)
    PersistentNotificationService().init(widget.token);
    
    // Initialize overlay notification service (overlay on top of apps)
    final tripService = TripService();
    // Start the native overlay service automatically (runs in background)
    _startOverlayService();
    
    // Initialize after first frame to ensure context is available
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        debugPrint('[MainScreen] Initializing OverlayNotificationService...');
        OverlayNotificationService().init(widget.token, tripService, context);
        debugPrint('[MainScreen] OverlayNotificationService initialized');
        
        // Update context when route changes
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            OverlayNotificationService().updateContext(context);
          }
        });
      }
    });
    
    // Listen for notifications
    SocketService().notificationStream.listen((data) {
      if (mounted) {
        final type = data['type']?.toString() ?? '';
        final eventData = data['data'] as Map<String, dynamic>? ?? {};
        
        switch (type) {
          // NEW_TRIP_OFFER case removed - overlay notification handles trip offers
          // No need for snackbar popup as overlay notification is shown instead
          
          case 'WALLET_UPDATE':
          case 'WALLET_CREDIT':
            final amount = eventData['amount']?.toString() ?? '0';
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.account_balance_wallet, color: Colors.white),
                    const SizedBox(width: 12),
                    Expanded(child: Text('Wallet Updated: ₹$amount')),
                  ],
                ),
                backgroundColor: Colors.green.shade600,
                action: SnackBarAction(
                  label: 'VIEW',
                  textColor: Colors.white,
                  onPressed: () => _navigate(0),
                ),
                duration: const Duration(seconds: 4),
                behavior: SnackBarBehavior.floating,
              ),
            );
            break;
            
          case 'TRIP_CANCELLED':
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Row(
                  children: [
                    Icon(Icons.cancel, color: Colors.white),
                    SizedBox(width: 12),
                    Expanded(child: Text('A trip has been cancelled')),
                  ],
                ),
                backgroundColor: Colors.orange.shade700,
                duration: const Duration(seconds: 4),
                behavior: SnackBarBehavior.floating,
              ),
            );
            break;
        }
      }
    });

    _pages = [
      HomeTab(token: widget.token, driverId: widget.driverId, onNavigate: _navigate),
      NotificationTab(token: widget.token),
      MenuTab(token: widget.token),
    ];
  }

  /// Start the native overlay service automatically when app opens
  /// This service will run in the background and show trip notifications
  /// even when the phone is locked or app is in background
  Future<void> _startOverlayService() async {
    try {
      debugPrint('[MainScreen] 🚀 Starting native overlay service...');
      final nativeOverlay = NativeOverlayService();
      
      // Check if overlay permission is granted
      final hasPermission = await nativeOverlay.checkOverlayPermission();
      if (!hasPermission) {
        debugPrint('[MainScreen] ⚠️ Overlay permission not granted, requesting...');
        await nativeOverlay.requestOverlayPermission();
        // Wait a bit for user to grant permission
        await Future.delayed(const Duration(seconds: 1));
      }
      
      // Start the service (it will run in foreground and persist)
      final started = await nativeOverlay.startService();
      if (started) {
        debugPrint('[MainScreen] ✅ Native overlay service started successfully');
        debugPrint('[MainScreen] ✅ Service will run in background and show trip notifications');
        debugPrint('[MainScreen] ✅ Service will work even when phone is locked');
      } else {
        debugPrint('[MainScreen] ⚠️ Failed to start native overlay service');
      }
    } catch (e) {
      debugPrint('[MainScreen] ❌ Error starting overlay service: $e');
      // Don't block app initialization if service start fails
    }
  }

  @override
  void dispose() {
    SocketService().dispose();
    PersistentNotificationService().dispose();
    OverlayNotificationService().dispose();
    // Note: We don't stop the native overlay service here
    // It should keep running until phone restart or user manually stops it
    super.dispose();
  }

  void _navigate(int index, {int? subTabIndex}) {
    setState(() => _selectedIndex = index);
    // Sub-tab navigation removed as Trips tab is gone
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: (i) => _navigate(i),
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: const Color(0xFF2575FC),
          unselectedItemColor: Colors.grey.shade400,
          showUnselectedLabels: true,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_filled), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.notifications), label: 'Notification'),
            BottomNavigationBarItem(icon: Icon(Icons.menu), label: 'Menu'),
          ],
        ),
      ),
    );
  }
}
