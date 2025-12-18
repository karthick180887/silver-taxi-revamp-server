import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../api_client.dart'; // To get kApiBaseUrl

class SocketService {
  static final SocketService _instance = SocketService._internal();

  factory SocketService() => _instance;

  SocketService._internal();

  IO.Socket? _socket;
  bool _isConnected = false;

  void connect(String token) {
    if (_isConnected && _socket != null) return;

    print("SocketService: Connecting to $kApiBaseUrl with token...");

    // Use standard Map for options to avoid OptionBuilder compatibility issues
    _socket = IO.io(
        kApiBaseUrl,
        <String, dynamic>{
          'transports': ['websocket', 'polling'], // Allow polling as fallback
          'autoConnect': true,
          'auth': {'token': token},
          'extraHeaders': {'Authorization': 'Bearer $token'}, // Also sending as header for safety
        }
    );

    _socket!.onConnect((_) {
      print('SocketService: Connected');
      _isConnected = true;
    });

    _socket!.onDisconnect((_) {
      print('SocketService: Disconnected');
      _isConnected = false;
    });

    _socket!.onConnectError((data) {
      print('SocketService: Connection Error: $data');
    });

    // Listen for generic 'notification' event used by backend
    _socket!.on('notification', (data) {
      print('SocketService: Received notification event: $data');
      if (data is Map) {
         _handleNotificationEvent(data);
      }
    });
  }

  void _handleNotificationEvent(Map data) {
    final type = data['type'];
    final payload = data['data'];

    print("Socket Event Type: $type");
    
    // Broadcast this using a Stream or ValueNotifier if UI needs to update
    // For now, logging it is sufficient for verification
    if (type == 'TRIP_UPDATE') {
       print("Trip Update Received: ${payload['status']}");
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
  }
  
  IO.Socket? get socket => _socket;
}
