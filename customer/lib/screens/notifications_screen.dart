import 'dart:async';
import 'package:flutter/material.dart';

import 'package:intl/intl.dart';
import '../api_client.dart';
import '../services/notification_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({
    super.key, 
    // Make these optional to allow screen to work if navigated from elsewhere without data
    this.token, 
    this.customerId, 
    this.adminId
  });

  final String? token;
  final String? customerId;
  final String? adminId;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  String _adminId = 'admin-1';
  String? _customerId;
  String _token = '';
  StreamSubscription? _notificationSubscription;

  @override
  void initState() {
    super.initState();
    _token = widget.token ?? ''; // Should ideally be passed, or retrieved from prefs
    _customerId = widget.customerId;
    _adminId = widget.adminId ?? 'admin-1';
    
    // If we have minimal data, fetch immediately, else load from prefs/API
    if (_token.isNotEmpty && _customerId != null) {
      _fetchNotifications();
    } else {
       // Minimal fallback if accessed directly (though unlikely in current flow)
       // We assume token is passed. If not, we can't do much without auth.
       if (_token.isNotEmpty) {
           // We might need to fetch customerId if not passed
           // For now, assuming it's passed or we skip
           setState(() => _isLoading = false);
       }
    }

    _notificationSubscription = NotificationService().onNotificationReceived.listen((event) {
      if (mounted) {
        _fetchNotifications();
      }
    }); 
  }

  @override
  void dispose() {
    _notificationSubscription?.cancel();
    super.dispose();
  }

  Future<void> _fetchNotifications() async {
    if (_customerId == null) return;
    try {
      final result = await _apiClient.getAllNotifications(
        token: _token,
        adminId: _adminId,
        customerId: _customerId!,
      );
      if (mounted && result.success && result.body['data'] != null) {
        setState(() {
          _notifications = result.body['data'] as List;
          _isLoading = false;
          // Sync global count
          final unread = _notifications.where((n) => n['read'] == false).length;
          NotificationService().updateUnreadCount(unread);
        });
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteNotification(String id) async {
    try {
      final result = await _apiClient.deleteNotification(
        token: _token,
        adminId: _adminId,
        customerId: _customerId!,
        notificationIds: [id],
      );

      if (mounted) {
        if (result.success) {
           _fetchNotifications(); // Refresh list
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Notification deleted")));
        } else {
           ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result.body['message'] ?? "Failed to delete")));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    }
  }

  Future<void> _markAsRead(String id) async {
     try {
       // Optimistic update
       setState(() {
          final index = _notifications.indexWhere((n) => (n['notifyId'] ?? n['id']).toString() == id);
          if (index != -1) {
            final updated = Map<String, dynamic>.from(_notifications[index]);
            updated['read'] = true;
            _notifications[index] = updated;
          }
       });

       await _apiClient.markNotificationAsRead(
         token: _token,
         adminId: _adminId,
         customerId: _customerId!,
         notificationId: id,
       );

       // Decrement global count
       NotificationService().decrementUnreadCount();
     } catch (e) {
       debugPrint("Error marking as read: $e");
     }
  }

  Future<void> _markAllAsRead() async {
    try {
       setState(() {
         // Optimistic update
         for (var i = 0; i < _notifications.length; i++) {
           final updated = Map<String, dynamic>.from(_notifications[i]);
           updated['read'] = true;
           _notifications[i] = updated;
         }
       });

       final result = await _apiClient.markAllNotificationsAsRead(
         token: _token,
         adminId: _adminId,
         customerId: _customerId!,
       );
       
       // Update global count to 0
       NotificationService().updateUnreadCount(0);
       
       if (mounted) {
         if (result.success) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("All marked as read")));
         }
       }
    } catch (e) {
       debugPrint("Error marking all read: $e");
    }
  }

  Future<void> _deleteAll() async {
     // Confirm dialog
     final confirm = await showDialog<bool>(
       context: context,
       builder: (context) => AlertDialog(
         title: const Text("Delete All"),
         content: const Text("Are you sure you want to delete all notifications?"),
         actions: [
           TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
           TextButton(onPressed: () => Navigator.pop(context, true), child: const Text("Delete", style: TextStyle(color: Colors.red))),
         ],
       ),
     );

     if (confirm != true) return;

     try {
        final ids = _notifications.map((n) => (n['notifyId'] ?? n['id']).toString()).toList();
        if (ids.isEmpty) return;

        final result = await _apiClient.deleteNotification(
          token: _token,
          adminId: _adminId,
          customerId: _customerId!, 
          notificationIds: ids
        );

        // Update global count to 0
        NotificationService().updateUnreadCount(0);

        if (mounted && result.success) {
           setState(() => _notifications.clear());
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("All notifications deleted")));
        }
     } catch (e) {
        debugPrint("Error deleting all: $e");
     }
  }

  @override
  Widget build(BuildContext context) {
    // Group notifications by date
    final groupedNotifications = <String, List<dynamic>>{};
    for (var notification in _notifications) {
      final dateStr = notification['createdAt'] ?? DateTime.now().toIso8601String();

      // Ensure we treat the input as UTC (if it ends in Z or T) or force it
      DateTime date = DateTime.parse(dateStr);
      if (!dateStr.endsWith('Z') && !date.isUtc) {
          // If backend sends "2023-12-18T00:00:00" implying UTC but no Z, we might need to assume it is UTC.
          // However, standard ISO usually parses correctly. 
          // Safest to rely on .toLocal() which handles UTC->Local.
          // If the string is already local time (but wrong for the user's zone), that's a backend issue.
          // Assuming backend sends UTC:
      }
      date = date.toLocal(); // Convert to device local time (IST)
      final now = DateTime.now();
      String key;
      
      final diff = now.difference(date).inDays;
      if (diff == 0 && now.day == date.day) {
        key = 'Today';
      } else if (diff == 1 || (diff == 0 && now.day != date.day)) {
        key = 'Yesterday';
      } else {
        key = DateFormat('dd/MM/yyyy').format(date);
      }
      
      if (!groupedNotifications.containsKey(key)) {
        groupedNotifications[key] = [];
      }
      groupedNotifications[key]!.add(notification);
    }

    final sortedKeys = groupedNotifications.keys.toList(); // Should be naturally sorted by fetch order if API returns sorted

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A1E3C), // Dark Blue
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            const Text(
              'Notifications',
              style: TextStyle(color: Colors.white),
            ),
            const SizedBox(width: 8),
            if (_notifications.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              child: Text('${_notifications.where((n) => n['read'] == false).length}', style: const TextStyle(fontSize: 12, color: Colors.white)),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all, color: Colors.white), 
            onPressed: _notifications.any((n) => n['read'] == false) ? _markAllAsRead : null,
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.white), 
            onPressed: _notifications.isNotEmpty ? _deleteAll : null,
          ),
        ],
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator()) 
          : RefreshIndicator(
              onRefresh: _fetchNotifications,
              child: _notifications.isEmpty 
                  ? const Center(child: Text("No notifications yet"))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: sortedKeys.length,
                      itemBuilder: (context, index) {
                        final key = sortedKeys[index];
                        final notifs = groupedNotifications[key]!;
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                             Text(
                              key,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
                            ),
                            const SizedBox(height: 16),
                            ...notifs.map((n) {
                              final id = n['notifyId'] ?? n['id']; // handle both cases
                              return Dismissible(
                                key: Key(id.toString()),
                                direction: DismissDirection.endToStart,
                                background: Container(
                                  color: Colors.red,
                                  alignment: Alignment.centerRight,
                                  padding: const EdgeInsets.only(right: 20),
                                  child: const Icon(Icons.delete, color: Colors.white),
                                ),
                                confirmDismiss: (direction) async {
                                  return true; // confirm delete?
                                },
                                onDismissed: (direction) {
                                  if (id != null) _deleteNotification(id.toString());
                                },
                                child: InkWell(
                                  onTap: () {
                                    final notificationId = (n['notifyId'] ?? n['id']).toString();
                                    if (n['read'] == false) {
                                       _markAsRead(notificationId);
                                    }
                                    
                                    showDialog(
                                      context: context,
                                      builder: (context) => AlertDialog(
                                        title: Text(n['title'] ?? 'Notification'),
                                        content: SingleChildScrollView(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Text(n['message'] ?? '', style: const TextStyle(fontSize: 16)),
                                              const SizedBox(height: 16),
                                              Text(
                                                n['createdAt'] != null 
                                                  ? DateFormat('dd MMM yyyy, h:mm a').format(DateTime.parse(n['createdAt']).toLocal()) 
                                                  : '',
                                                style: TextStyle(color: Colors.grey[600], fontSize: 12),
                                              ),
                                            ],
                                          ),
                                        ),
                                        actions: [
                                          TextButton(
                                            onPressed: () => Navigator.pop(context),
                                            child: const Text('Close'),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                  child: _buildNotificationItem(
                                    title: n['title'] ?? 'Notification',
                                    body: n['message'] ?? '',
                                    time: n['createdAt'] != null ? DateFormat('h:mm:ss a').format(DateTime.parse(n['createdAt']).toLocal()) : '',
                                    isUnread: !(n['read'] ?? true),
                                  ),
                                ),
                              );
                            }),
                            const SizedBox(height: 8),
                          ],
                        );
                      },
                    ),
            ),
    );
  }

  Widget _buildNotificationItem({
    required String title,
    required String body,
    required String time,
    bool isUnread = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: const BoxDecoration(
              color: Color(0xFFFFD700), // Yellow/Gold
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.directions_car, color: Colors.white),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  body,
                  style: TextStyle(color: Colors.grey[600], fontSize: 14),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  time,
                  style: TextStyle(color: Colors.grey[400], fontSize: 12),
                ),
              ],
            ),
          ),
          if (isUnread)
            Container(
              margin: const EdgeInsets.only(top: 8),
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
            ),
        ],
      ),
    );
  }
}
