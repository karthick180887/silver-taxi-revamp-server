import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:customer_app/services/socket_service.dart';
import 'package:customer_app/services/notification_service.dart';
import 'package:customer_app/api_client.dart';
import 'home_screen.dart';
import 'profile_screen.dart';
import 'wallet_screen.dart';
import 'login_screen.dart';
import 'notifications_screen.dart';

class CustomerMainScreen extends StatefulWidget {
  const CustomerMainScreen({super.key, required this.token});
  final String token;

  @override
  State<CustomerMainScreen> createState() => _CustomerMainScreenState();
}

class _CustomerMainScreenState extends State<CustomerMainScreen> {
  int _selectedIndex = 0;
  // int _unreadCount = 0; // Removed local state
  StreamSubscription? _notificationSubscription;
  final List<Widget> _pages = [];

  String? _customerId;
  String? _adminId;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
    
    // Connect to Socket
    try {
        NotificationService().requestPermission();
        SocketService().connect(widget.token);
    } catch (e) {
        print("Socket connection error: $e");
    }

    _pages.addAll([
      HomeScreen(token: widget.token),
      ProfileScreen(token: widget.token),
      WalletScreen(token: widget.token),
    ]);

    _syncFCMToken();
    _fetchUnreadCount();
    
    _notificationSubscription = NotificationService().onNotificationReceived.listen((event) {
        if (mounted) {
            NotificationService().incrementUnreadCount();
        }
    });
  }

  Future<void> _loadPreferences() async {
      final prefs = await SharedPreferences.getInstance();
      setState(() {
          _customerId = prefs.getString('customer_id');
          _adminId = prefs.getString('admin_id') ?? 'admin-1';
      });
      _fetchUnreadCount(); // Fetch after loading ID
  }

  @override
  void dispose() {
    _notificationSubscription?.cancel();
    super.dispose();
  }

  Future<void> _fetchUnreadCount() async {
      // If we don't have customerId yet, try to load it or return
      if (_customerId == null) {
          final prefs = await SharedPreferences.getInstance();
          _customerId = prefs.getString('customer_id');
          _adminId = prefs.getString('admin_id') ?? 'admin-1';
      }

      if (_customerId == null) return;

      try {
           final apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);
           final result = await apiClient.getAllNotifications(token: widget.token, adminId: _adminId ?? 'admin-1', customerId: _customerId!);
           if (result.success && result.body['data'] != null) {
               final list = result.body['data'] as List;
               final unread = list.where((n) => n['read'] == false).length;
               // if (mounted) setState(() => _unreadCount = unread);
               NotificationService().updateUnreadCount(unread);
           }
      } catch (e) {
          print("Error fetching unread count: $e");
      }
  }

  Future<void> _syncFCMToken() async {
    try {
      final fcmToken = await NotificationService().getToken();
      if (fcmToken != null) {
        print("Syncing FCM Token: $fcmToken");
        final apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);
        await apiClient.updateFCMToken(token: widget.token, fcmToken: fcmToken);
        
        // Trigger generic "Notifictions Active" message to force system registration
        NotificationService().showLocalNotification(
          "Notifications Active", 
          "You will now receive updates for your rides."
        );
      }
    } catch (e) {
      print("Failed to sync FCM token: $e");
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('customer_token');
    await prefs.remove('customer_id');
    // Keep admin_id if needed, or remove

    SocketService().disconnect();

    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
          // Refresh notification count when switching tabs so Profile/Wallet catch up
          _fetchUnreadCount();
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_wallet),
            label: 'Wallet',
          ),
        ],
      ),
      appBar: _selectedIndex == 0
          ? null
          : AppBar(
              title: const Text('Silver Taxi Customer'),
              actions: [
                  Stack(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.notifications),
                        onPressed: () async {
                          // Navigate to notifications
                           await Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => NotificationsScreen(
                                token: widget.token,
                                customerId: _customerId,
                                adminId: _adminId,
                              ),
                            ),
                           );
                          // Refresh count on return
                          _fetchUnreadCount();
                        },
                        tooltip: 'Notifications',
                      ),
                      if (_selectedIndex != 0) // Only show if not Home (Home has its own)
                      ValueListenableBuilder<int>(
                        valueListenable: NotificationService().unreadCount,
                        builder: (context, count, child) {
                          if (count == 0) return const SizedBox.shrink();
                          return Positioned(
                            right: 8,
                            top: 8,
                            child: Container(
                              padding: const EdgeInsets.all(2),
                              decoration: BoxDecoration(
                                color: Colors.red,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              constraints: const BoxConstraints(
                                minWidth: 14,
                                minHeight: 14,
                              ),
                              child: Text(
                                '$count',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 8,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          );
                        }
                      )
                    ],
                  ),
                IconButton(
                  icon: const Icon(Icons.logout),
                  onPressed: _logout,
                  tooltip: 'Logout',
                ),
              ],
            ),
    );
  }
}

