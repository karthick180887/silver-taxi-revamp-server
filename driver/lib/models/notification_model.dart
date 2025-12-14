class NotificationItem {
  final String id;
  final String type;
  final String title;
  final String body;
  final DateTime timestamp;
  final bool isRead;
  final Map<String, dynamic> data;

  NotificationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.timestamp,
    this.isRead = false,
    required this.data,
  });

  factory NotificationItem.fromSocket(Map<String, dynamic> socketData) {
    final type = socketData['type']?.toString() ?? 'UNKNOWN';
    final data = socketData['data'] as Map<String, dynamic>? ?? {};
    
    String title;
    String body;
    
    switch (type) {
      case 'NEW_TRIP_OFFER':
        title = '🆕 New Trip Offer';
        // Try to get pickup address from booking data
        final booking = data['pickupLocation'] ?? data;
        final address = booking is Map 
            ? (booking['address']?.toString() ?? 'New trip request')
            : 'New trip request';
        body = 'New trip available: $address';
        break;
      case 'TRIP_CANCELLED':
        title = '❌ Trip Cancelled';
        body = 'A trip has been cancelled.';
        break;
      case 'TRIP_ACCEPTED':
        title = '✅ Trip Accepted';
        body = 'A trip was accepted by another driver.';
        break;
      case 'WALLET_UPDATE':
      case 'WALLET_CREDIT':
        final amount = data['amount']?.toString() ?? '0';
        title = '💰 Wallet Updated';
        body = 'Your wallet has been updated. Amount: ₹$amount';
        break;
      default:
        title = '📢 Notification';
        body = data['message']?.toString() ?? data['body']?.toString() ?? 'You have a new notification';
    }
    
    return NotificationItem(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      type: type,
      title: title,
      body: body,
      timestamp: DateTime.now(),
      isRead: false,
      data: data,
    );
  }

  factory NotificationItem.fromApi(Map<String, dynamic> apiData) {
    // Handle both camelCase and snake_case field names
    final type = apiData['type']?.toString() ?? 
                 apiData['Type']?.toString() ?? 'UNKNOWN';
    final title = apiData['title']?.toString() ?? 
                  apiData['Title']?.toString() ?? 'Notification';
    // API uses "description" field, not "body"
    final body = apiData['description']?.toString() ?? 
                 apiData['Description']?.toString() ??
                 apiData['body']?.toString() ?? 
                 apiData['Body']?.toString() ?? 'You have a new notification';
    // API uses "read" field (boolean), not "isRead"
    final isRead = apiData['read'] as bool? ??
                   apiData['Read'] as bool? ??
                   apiData['isRead'] as bool? ?? 
                   apiData['is_read'] as bool? ?? 
                   apiData['IsRead'] as bool? ?? false;
    
    // Try multiple date field names (API uses "date" or "createdAt")
    final dateStr = apiData['date']?.toString() ??
                    apiData['Date']?.toString() ??
                    apiData['createdAt']?.toString() ?? 
                    apiData['created_at']?.toString() ?? 
                    apiData['CreatedAt']?.toString() ?? '';
    
    DateTime timestamp;
    try {
      if (dateStr.isNotEmpty) {
        timestamp = DateTime.parse(dateStr);
      } else {
        timestamp = DateTime.now();
      }
    } catch (e) {
      timestamp = DateTime.now();
    }
    
    // Try multiple ID field names
    final id = apiData['notificationId']?.toString() ?? 
               apiData['notification_id']?.toString() ?? 
               apiData['id']?.toString() ?? 
               apiData['Id']?.toString() ?? 
               DateTime.now().millisecondsSinceEpoch.toString();
    
    // Extract data - could be JSONB or nested
    Map<String, dynamic> data;
    if (apiData['data'] != null) {
      if (apiData['data'] is Map) {
        data = Map<String, dynamic>.from(apiData['data']);
      } else {
        data = apiData;
      }
    } else {
      data = apiData;
    }
    
    return NotificationItem(
      id: id,
      type: type,
      title: title,
      body: body,
      timestamp: timestamp,
      isRead: isRead,
      data: data,
    );
  }

  NotificationItem copyWith({
    String? id,
    String? type,
    String? title,
    String? body,
    DateTime? timestamp,
    bool? isRead,
    Map<String, dynamic>? data,
  }) {
    return NotificationItem(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      body: body ?? this.body,
      timestamp: timestamp ?? this.timestamp,
      isRead: isRead ?? this.isRead,
      data: data ?? this.data,
    );
  }

  String get timeAgo {
    final diff = DateTime.now().difference(timestamp);
    
    if (diff.inSeconds < 60) {
      return '${diff.inSeconds} seconds ago';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes} minutes ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours} hours ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} days ago';
    } else {
      return '${diff.inDays ~/ 7} weeks ago';
    }
  }
}
