import 'package:flutter/material.dart';
import '../services/socket_service.dart';
import '../services/persistent_notification_service.dart';
import '../services/overlay_notification_service.dart';
import '../services/native_overlay_service.dart';
import '../services/trip_service.dart';
import '../services/fcm_service.dart';
import '../core/service_locator.dart'; // Added missing import
import 'home_tab.dart';
import 'notification_tab.dart';
import 'menu_tab.dart';
import '../design_system.dart';

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
    
    // We don't init services here anymore - AppController does it.
    // We just need to link the Context to the OverlayService.
    
    // Initialize after first frame to ensure context is available
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        debugPrint('[MainScreen] Linking OverlayNotificationService to Context...');
        // Use ServiceLocator to get the singleton instances
        final overlayService = ServiceLocator().overlayController;
        final tripService = ServiceLocator().trip;
        
        overlayService.init(widget.token, tripService, context);
        
        // Update context when route changes
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            overlayService.updateContext(context);
          }
        });
      }
    });
    
    // Listen for UI notifications (SnackBars)
    ServiceLocator().socket.notificationStream.listen((data) {
      if (mounted) {
        final type = data['type']?.toString() ?? '';
        final eventData = data['data'] as Map<String, dynamic>? ?? {};
        
        switch (type) {
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


  @override
  void dispose() {
    // Services are global singletons managed by ServiceLocator/AppController
    // We do NOT dispose them here.
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
          color: AppColors.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: (i) => _navigate(i),
          type: BottomNavigationBarType.fixed,
          backgroundColor: AppColors.surface,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textTertiary,
          showUnselectedLabels: true,
          selectedLabelStyle: AppTextStyles.label.copyWith(fontSize: 12),
          unselectedLabelStyle: AppTextStyles.label.copyWith(fontSize: 12, fontWeight: FontWeight.normal),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_filled), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.notifications_rounded), label: 'Notification'),
            BottomNavigationBarItem(icon: Icon(Icons.grid_view_rounded), label: 'Menu'),
          ],
        ),
      ),
    );
  }
}
