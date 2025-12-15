import 'package:flutter/material.dart';

import 'package:intl/intl.dart';
import '../api_client.dart';

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
        });
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Group notifications by date
    final groupedNotifications = <String, List<dynamic>>{};
    for (var notification in _notifications) {
      final dateStr = notification['createdAt'] ?? DateTime.now().toIso8601String();
      final date = DateTime.parse(dateStr);
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
          IconButton(icon: const Icon(Icons.done_all, color: Colors.white), onPressed: () {}),
          IconButton(icon: const Icon(Icons.delete_outline, color: Colors.white), onPressed: () {}),
        ],
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator()) 
          : _notifications.isEmpty 
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
                        ...notifs.map((n) => _buildNotificationItem(
                          title: n['title'] ?? 'Notification',
                          body: n['message'] ?? '',
                          time: n['createdAt'] != null ? DateFormat('h:mm:ss a').format(DateTime.parse(n['createdAt'])) : '',
                          isUnread: !(n['read'] ?? true),
                        )),
                        const SizedBox(height: 8),
                      ],
                    );
                  },
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
