import 'package:flutter/material.dart';
import '../api_client.dart';

class NotificationSettingsPage extends StatefulWidget {
  const NotificationSettingsPage({super.key, required this.token});
  final String token;

  @override
  State<NotificationSettingsPage> createState() => _NotificationSettingsPageState();
}

class _NotificationSettingsPageState extends State<NotificationSettingsPage> {
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  bool _loading = false;
  String? _error;
  List<_NotificationRecord> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _api.getNotifications(token: widget.token);
      if (!res.success) {
        throw Exception(res.body['message'] ?? 'Failed to load notifications');
      }
      final list = _extractList(res.body['data']);
      if (mounted) setState(() => _items = list);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<_NotificationRecord> _extractList(dynamic data) {
    final List<_NotificationRecord> result = [];
    List<dynamic> raw = [];
    if (data is List) {
      raw = data;
    } else if (data is Map) {
      final inner = data['notifications'] ?? data['data'] ?? data['rows'] ?? data['items'];
      if (inner is List) raw = inner;
    }

    for (final item in raw) {
      if (item is Map<String, dynamic>) {
        result.add(_NotificationRecord.fromMap(item));
      } else if (item is Map) {
        result.add(_NotificationRecord.fromMap(Map<String, dynamic>.from(item)));
      }
    }
    return result;
  }

  Future<void> _markAllRead() async {
    try {
      final res = await _api.markAllNotificationsRead(token: widget.token);
      if (!res.success) throw Exception(res.body['message'] ?? 'Failed to mark as read');
      if (mounted) {
        setState(() {
          _items = _items.map((n) => n.copyWith(isRead: true)).toList();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _deleteAll() async {
    final ids = _items.map((n) => n.id).toList();
    if (ids.isEmpty) return;
    try {
      final res = await _api.deleteNotifications(token: widget.token, notificationIds: ids);
      if (!res.success) throw Exception(res.body['message'] ?? 'Failed to delete notifications');
      if (mounted) setState(() => _items = []);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification Settings'),
        actions: [
          IconButton(
            onPressed: _items.isEmpty ? null : _markAllRead,
            icon: const Icon(Icons.done_all),
            tooltip: 'Mark all as read',
          ),
          IconButton(
            onPressed: _items.isEmpty ? null : _deleteAll,
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Delete all',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text(
                        'Unable to load notifications',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(_error!, style: TextStyle(color: Colors.red.shade600)),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _load, child: const Text('Retry')),
                    ],
                  )
                : _items.isEmpty
                    ? ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          Icon(Icons.notifications_none, size: 64, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          Center(
                            child: Text('No notifications found', style: TextStyle(color: Colors.grey.shade600)),
                          ),
                          const SizedBox(height: 8),
                          Center(
                            child: Text(
                              'Pull to refresh for updates',
                              style: TextStyle(color: Colors.grey.shade500),
                            ),
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(12),
                        itemCount: _items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final notif = _items[index];
                          return Container(
                            decoration: BoxDecoration(
                              color: notif.isRead ? Colors.grey.shade100 : const Color(0xFFEAF6FF),
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.04),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: Colors.blue.shade50,
                                child: Icon(
                                  _iconFor(notif.type),
                                  color: Colors.blue,
                                ),
                              ),
                              title: Text(
                                notif.title,
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Text(notif.body),
                                  const SizedBox(height: 4),
                                  Text(
                                    notif.timeAgo,
                                    style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                  ),
                                ],
                              ),
                              trailing: notif.isRead
                                  ? null
                                  : IconButton(
                                      icon: const Icon(Icons.done),
                                      tooltip: 'Mark as read',
                                      onPressed: () {
                                        setState(() {
                                          _items[index] = notif.copyWith(isRead: true);
                                        });
                                      },
                                    ),
                            ),
                          );
                        },
                      ),
      ),
    );
  }

  IconData _iconFor(String type) {
    switch (type.toUpperCase()) {
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

class _NotificationRecord {
  _NotificationRecord({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.timestamp,
    required this.isRead,
  });

  final String id;
  final String title;
  final String body;
  final String type;
  final DateTime timestamp;
  final bool isRead;

  factory _NotificationRecord.fromMap(Map<String, dynamic> map) {
    final id = (map['id'] ?? map['_id'] ?? map['notificationId'] ?? '').toString();
    final ts = map['createdAt'] ?? map['timestamp'] ?? map['date'];
    DateTime parsed = DateTime.now();
    if (ts is String) {
      parsed = DateTime.tryParse(ts) ?? DateTime.now();
    } else if (ts is int) {
      parsed = DateTime.fromMillisecondsSinceEpoch(ts);
    }
    return _NotificationRecord(
      id: id.isEmpty ? DateTime.now().millisecondsSinceEpoch.toString() : id,
      title: (map['title'] ?? map['heading'] ?? 'Notification').toString(),
      body: (map['body'] ?? map['message'] ?? '').toString(),
      type: (map['type'] ?? map['category'] ?? 'UNKNOWN').toString(),
      timestamp: parsed,
      isRead: (map['isRead'] ?? map['read'] ?? map['readStatus'] ?? false) == true,
    );
  }

  _NotificationRecord copyWith({bool? isRead}) {
    return _NotificationRecord(
      id: id,
      title: title,
      body: body,
      type: type,
      timestamp: timestamp,
      isRead: isRead ?? this.isRead,
    );
  }

  String get timeAgo {
    final diff = DateTime.now().difference(timestamp);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s ago';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${diff.inDays ~/ 7}w ago';
  }
}
