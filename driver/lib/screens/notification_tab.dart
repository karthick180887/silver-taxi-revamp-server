import 'dart:async';
import 'package:flutter/cupertino.dart';
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
      final res = await _api.getAllNotifications(token: widget.token);
      
      if (res.success && res.body['data'] != null) {
        final data = res.body['data'];
        List<dynamic> notifications = [];
        if (data is List) {
          notifications = data;
        } else if (data is Map) {
          notifications = data['notifications'] as List? ?? 
                         data['list'] as List? ?? 
                         (data.values.first is List ? data.values.first as List : []);
        }
        
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
                return null;
              }
            }).whereType<NotificationItem>().toList();
            
            // Limit to 20 for better performance (2 was too restrictive)
            _notifications.addAll(parsed.take(20).toList());
            _loading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _loading = false;
            if (_notifications.isEmpty) {
              _error = 'No notifications found';
            }
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
      }
    }
  }

  void _listenToSocket() {
    _notifSub = SocketService().notificationStream.listen((data) {
      if (mounted) {
        setState(() {
          final newNotif = NotificationItem.fromSocket(data);
          final exists = _notifications.any((n) => 
            n.type == newNotif.type && 
            n.data['bookingId'] == newNotif.data['bookingId'] ||
            n.data['tripId'] == newNotif.data['tripId']
          );
          
          if (!exists) {
            _notifications.insert(0, newNotif);
            if (_notifications.length > 20) {
              _notifications.removeLast();
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

  void _deleteAll() async {
    if (_notifications.isEmpty) return;
    final ids = _notifications.map((n) => n.id).toList();
    setState(() {
      _notifications.clear();
    });
    try {
      await _api.deleteNotifications(token: widget.token, notificationIds: ids);
    } catch (_) {}
  }

  Future<void> _deleteNotificationFromBackend(String notificationId) async {
    try {
      await _api.deleteNotifications(token: widget.token, notificationIds: [notificationId]);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        title: const Text(
          'Notifications',
          style: TextStyle(
            color: Color(0xFF1E293B),
            fontSize: 24,
            fontWeight: FontWeight.bold,
            letterSpacing: -0.5,
          ),
        ),
        actions: [
          if (_notifications.isNotEmpty) ...[
            IconButton(
              onPressed: _markAllAsRead,
              icon: const Icon(Icons.done_all, color: Color(0xFF2563EB)),
              tooltip: 'Mark all as read',
            ),
            IconButton(
              onPressed: _deleteAll,
              icon: Icon(CupertinoIcons.trash, color: Colors.red.shade400, size: 20),
              tooltip: 'Clear all',
            ),
            const SizedBox(width: 8),
          ]
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)))
          : _error != null && _notifications.isEmpty
              ? _buildErrorState()
              : _notifications.isEmpty
                  ? _buildEmptyState()
                  : RefreshIndicator(
                      onRefresh: () async => _loadNotifications(),
                      color: const Color(0xFF2563EB),
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                        itemCount: _notifications.length,
                        separatorBuilder: (ctx, i) => const SizedBox(height: 12),
                        itemBuilder: (ctx, i) {
                          final notif = _notifications[i];
                          return _buildNotificationCard(notif);
                        },
                      ),
                    ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              shape: BoxShape.circle,
            ),
            child: Icon(CupertinoIcons.bell_slash, size: 48, color: Colors.blue.shade300),
          ),
          const SizedBox(height: 24),
          Text(
            'No notifications yet',
            style: TextStyle(
              color: Colors.grey.shade800,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'We\'ll let you know when something\nimportant comes up.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: _loadNotifications,
            icon: const Icon(CupertinoIcons.refresh, size: 16),
            label: const Text('Refresh'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF2563EB),
              elevation: 0,
              side: BorderSide(color: Colors.grey.shade300),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 48, color: Colors.red.shade300),
          const SizedBox(height: 16),
          Text(
            'Something went wrong',
            style: TextStyle(color: Colors.grey.shade800, fontSize: 16, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loadNotifications,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2563EB),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationCard(NotificationItem notif) {
    final isNewTrip = notif.type == 'NEW_TRIP_OFFER';
    
    return Dismissible(
      key: Key(notif.id),
      direction: DismissDirection.endToStart,
      background: Container(
        margin: const EdgeInsets.only(bottom: 2),
        decoration: BoxDecoration(
          color: Colors.red.shade400,
          borderRadius: BorderRadius.circular(16),
        ),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 24),
        child: const Icon(CupertinoIcons.trash, color: Colors.white),
      ),
      onDismissed: (_) {
        final id = notif.id;
        setState(() => _notifications.removeWhere((n) => n.id == id));
        _deleteNotificationFromBackend(id);
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: notif.isRead ? Colors.white : const Color(0xFFF0F9FF),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: notif.isRead ? Colors.grey.shade100 : Colors.blue.shade100,
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isNewTrip ? Colors.green.shade50 : 
                       notif.isRead ? Colors.grey.shade50 : Colors.blue.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(
                _getIconForType(notif.type),
                color: isNewTrip ? Colors.green.shade600 :
                       notif.isRead ? Colors.grey.shade400 : const Color(0xFF2563EB),
                size: 22,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          notif.title,
                          style: TextStyle(
                            fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.bold,
                            fontSize: 15,
                            color: const Color(0xFF1E293B),
                          ),
                        ),
                      ),
                      Text(
                        notif.timeAgo,
                        style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    notif.body,
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                  if (isNewTrip) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.green.shade100),
                      ),
                      child: Text(
                        'New Opportunity',
                        style: TextStyle(
                          color: Colors.green.shade700,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ]
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'NEW_TRIP_OFFER':
        return CupertinoIcons.car_detailed;
      case 'TRIP_CANCELLED':
        return CupertinoIcons.xmark_circle_fill;
      case 'TRIP_ACCEPTED':
        return CupertinoIcons.checkmark_circle_fill;
      case 'WALLET_UPDATE':
      case 'WALLET_CREDIT':
        return CupertinoIcons.money_dollar_circle_fill;
      default:
        return CupertinoIcons.bell_fill;
    }
  }
}
