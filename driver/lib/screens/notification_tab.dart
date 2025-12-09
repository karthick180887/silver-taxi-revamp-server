import 'dart:async';
import 'package:flutter/material.dart';
import '../services/socket_service.dart';
import '../models/notification_model.dart';
import '../api_client.dart';

class NotificationTab extends StatefulWidget {
  const NotificationTab({super.key, required this.token});
  final String token;

  @override
  State<NotificationTab> createState() => _NotificationTabState();
}

class _NotificationTabState extends State<NotificationTab> {
  final List<NotificationItem> _notifications = [];
  StreamSubscription? _notifSub;
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _listenToSocket();
  }

  void _loadNotifications() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Load existing notifications from API
      final res = await _api.getAllNotifications(token: widget.token);
      debugPrint('[NotificationTab] API Response: ${res.body}');
      
      if (res.success && res.body['data'] != null) {
        final data = res.body['data'];
        // Handle both array and object with notifications array
        List<dynamic> notifications = [];
        if (data is List) {
          notifications = data;
        } else if (data is Map) {
          notifications = data['notifications'] as List? ?? 
                         data['list'] as List? ?? 
                         (data.values.first is List ? data.values.first as List : []);
        }
        
        debugPrint('[NotificationTab] Parsed ${notifications.length} notifications from API');
        debugPrint('[NotificationTab] First notification sample: ${notifications.isNotEmpty ? notifications[0] : "none"}');
        
        if (mounted) {
          setState(() {
            _notifications.clear();
            final parsed = notifications.map((n) {
              try {
                if (n is Map) {
                  return NotificationItem.fromApi(n as Map<String, dynamic>);
                }
                return null;
              } catch (e) {
                debugPrint('[NotificationTab] Error parsing notification: $e, data: $n');
                return null;
              }
            }).whereType<NotificationItem>().toList();
            
            // Limit to 2 notifications for driver app
            _notifications.addAll(parsed.take(2).toList());
            debugPrint('[NotificationTab] Successfully loaded ${_notifications.length} notifications (limited to 2)');
            _loading = false;
          });
        }
      } else {
        debugPrint('[NotificationTab] API call failed or no data');
        debugPrint('[NotificationTab] Response: ${res.body}');
        if (mounted) {
          setState(() {
            _loading = false;
            if (_notifications.isEmpty) {
              _error = 'No notifications found. API response: ${res.body}';
            }
          });
        }
      }
    } catch (e, stackTrace) {
      debugPrint('Error loading notifications: $e');
      debugPrint('Stack trace: $stackTrace');
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
      }
    }
  }

  void _listenToSocket() {
    // Listen to incoming notifications from Socket.IO
    _notifSub = SocketService().notificationStream.listen((data) {
      debugPrint('NotificationTab: Received socket notification: $data');
      if (mounted) {
        setState(() {
          // Check if notification already exists (by type and data)
          final newNotif = NotificationItem.fromSocket(data);
          final exists = _notifications.any((n) => 
            n.type == newNotif.type && 
            n.data['bookingId'] == newNotif.data['bookingId'] ||
            n.data['tripId'] == newNotif.data['tripId']
          );
          
          if (!exists) {
            _notifications.insert(0, newNotif);
            // Limit to 2 notifications
            if (_notifications.length > 2) {
              _notifications.removeRange(2, _notifications.length);
            }
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _notifSub?.cancel();
    super.dispose();
  }

  void _markAllAsRead() {
    setState(() {
      for (int i = 0; i < _notifications.length; i++) {
        _notifications[i] = _notifications[i].copyWith(isRead: true);
      }
    });
  }

  void _deleteAll() {
    setState(() {
      _notifications.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          IconButton(
            onPressed: _notifications.isEmpty ? null : _markAllAsRead,
            icon: const Icon(Icons.done_all, color: Colors.blue),
          ),
          IconButton(
            onPressed: _notifications.isEmpty ? null : _deleteAll,
            icon: const Icon(Icons.delete_outline, color: Colors.red),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
                      const SizedBox(height: 16),
                      Text(
                        'Error loading notifications',
                        style: TextStyle(color: Colors.grey.shade600, fontSize: 16),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _error!,
                        style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadNotifications,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _notifications.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.notifications_none, size: 64, color: Colors.grey.shade400),
                          const SizedBox(height: 16),
                          Text(
                            'No notifications yet',
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'New notifications will appear here',
                            style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton.icon(
                            onPressed: _loadNotifications,
                            icon: const Icon(Icons.refresh),
                            label: const Text('Refresh'),
                          ),
                        ],
                      ),
                    )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _notifications.length,
              itemBuilder: (ctx, i) {
                final notif = _notifications[i];
                return Dismissible(
                  key: Key(notif.id),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.centerRight,
                    child: const Icon(Icons.delete, color: Colors.white),
                  ),
                  onDismissed: (_) {
                    setState(() {
                      _notifications.removeAt(i);
                    });
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: notif.isRead ? Colors.grey.shade100 : const Color(0xFFEAF6FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: notif.isRead ? Colors.grey.shade300 : const Color(0xFFCBE6FF),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            _getIconForType(notif.type),
                            color: notif.isRead ? Colors.grey.shade600 : const Color(0xFF2575FC),
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                notif.title,
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  color: notif.isRead ? Colors.grey.shade700 : Colors.black,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                notif.body,
                                style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                notif.timeAgo,
                                style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        if (!notif.isRead)
                          Container(
                            margin: const EdgeInsets.only(top: 4),
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Color(0xFF2575FC),
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'NEW_TRIP_OFFER':
        return Icons.directions_car;
      case 'TRIP_CANCELLED':
        return Icons.cancel;
      case 'WALLET_UPDATE':
      case 'WALLET_CREDIT':
        return Icons.account_balance_wallet;
      default:
        return Icons.notifications;
    }
  }
}
