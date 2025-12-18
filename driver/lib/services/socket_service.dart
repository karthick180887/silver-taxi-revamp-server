import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../api_client.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  final _notificationController = StreamController<Map<String, dynamic>>.broadcast();
  final _walletUpdateController = StreamController<Map<String, dynamic>>.broadcast();
  final _bookingUpdateController = StreamController<Map<String, dynamic>>.broadcast();
  bool _isAuthenticated = false;

  Stream<Map<String, dynamic>> get notificationStream => _notificationController.stream;
  Stream<Map<String, dynamic>> get walletUpdateStream => _walletUpdateController.stream;
  Stream<Map<String, dynamic>> get bookingUpdateStream => _bookingUpdateController.stream;
  
  bool get isConnected {
    final connected = _socket != null && _socket!.connected;
    if (!connected) {
      debugPrint('[SocketService] isConnected check: false (socket=${_socket != null}, connected=${_socket?.connected})');
    }
    return connected;
  }
  
  bool get isAuthenticated => _isAuthenticated;

  void init(String token) {
    if (_socket != null && _socket!.connected) return;

    // Ensure we don't have duplicate listeners if re-initializing
    _socket?.dispose();
    _isAuthenticated = false;

    debugPrint('[SocketService] Initializing socket connection to $kApiBaseUrl');
    
    // IMPORTANT: Use WebSocket-only transport
    // The socket_io_client package has issues with HTTP polling transport
    // that causes timeout errors even when the endpoint is reachable.
    // WebSocket-only bypasses this bug.
    _socket = io.io(
      kApiBaseUrl,
      io.OptionBuilder()
        .setTransports(['websocket'])  // WebSocket ONLY - polling is buggy
        .enableForceNew()
        .disableAutoConnect()
        .setAuth({'token': token})
        .setQuery({'token': token})
        .enableReconnection()
        .setReconnectionAttempts(5)
        .setReconnectionDelay(2000)
        .build()
    );
    
    debugPrint('[SocketService] Socket instance created, setting up listeners...');

    // Set up all listeners BEFORE connecting
    _socket!.onConnect((_) {
      debugPrint('========================================');
      debugPrint('✅✅✅ SOCKET CONNECTED! ✅✅✅');
      debugPrint('Socket ID: ${_socket!.id}');
      debugPrint('Socket connected: ${_socket!.connected}');
      debugPrint('========================================');
      
      // Wait a bit for connection to stabilize, then test if we can receive events
      Future.delayed(const Duration(milliseconds: 500), () {
        debugPrint('[SocketService] Testing event reception - sending test emit...');
        // Try to emit a test event to verify bidirectional communication
        _socket!.emit('test', {'message': 'client_test'});
      });
    });

    _socket!.on('auth_success', (data) {
      debugPrint('========================================');
      debugPrint('✅✅✅ SOCKET AUTH SUCCESS! ✅✅✅');
      debugPrint('Auth data type: ${data.runtimeType}');
      debugPrint('Auth data: $data');
      debugPrint('========================================');
      _isAuthenticated = true;
      debugPrint('[SocketService] Socket is now authenticated and ready to receive events');
    });

    _socket!.on('auth_error', (data) {
      debugPrint('========================================');
      debugPrint('❌❌❌ SOCKET AUTH ERROR! ❌❌❌');
      debugPrint('Error data: $data');
      debugPrint('========================================');
    });
    
    _socket!.onConnectError((error) {
      debugPrint('========================================');
      debugPrint('❌❌❌ SOCKET CONNECTION ERROR! ❌❌❌');
      debugPrint('Error type: ${error.runtimeType}');
      debugPrint('Error: $error');
      debugPrint('Error details: ${error.toString()}');
      debugPrint('========================================');
    });
    
    _socket!.onDisconnect((reason) {
      debugPrint('========================================');
      debugPrint('⚠️⚠️⚠️ SOCKET DISCONNECTED! ⚠️⚠️⚠️');
      debugPrint('Reason: $reason');
      debugPrint('========================================');
      _isAuthenticated = false; // Reset auth status on disconnect
      // Attempt to reconnect
      if (reason != 'io client disconnect') {
        debugPrint('Attempting to reconnect...');
        Future.delayed(const Duration(seconds: 2), () {
          if (_socket != null && !_socket!.connected) {
            _socket!.connect();
          }
        });
      }
    });

    _socket!.on('notification', (data) {
      debugPrint('========================================');
      debugPrint('🔔 Socket notification received!');
      debugPrint('Raw data type: ${data.runtimeType}');
      debugPrint('Raw data: $data');
      debugPrint('========================================');
      
      if (data is Map<String, dynamic>) {
        final type = data['type']?.toString() ?? '';
        final eventData = data['data'];
        
        debugPrint('📋 Parsed notification:');
        debugPrint('   Type: $type');
        debugPrint('   EventData type: ${eventData.runtimeType}');
        debugPrint('   EventData: $eventData');
        
        // Broadcast to general notification stream
        _notificationController.add(data);
        debugPrint('✅ Added to notificationStream');
        
        // Route to specific streams based on type
        switch (type) {
          case 'WALLET_UPDATE':
          case 'WALLET_CREDIT':
            debugPrint('💰 Routing to walletUpdateStream');
            if (eventData is Map<String, dynamic>) {
              _walletUpdateController.add(eventData);
            }
            break;
          case 'NEW_TRIP_OFFER':
          case 'TRIP_CANCELLED':
          case 'TRIP_ACCEPTED':
            debugPrint('========================================');
            debugPrint('🚗🚗🚗 ROUTING TO bookingUpdateStream 🚗🚗🚗');
            debugPrint('   Type: $type');
            debugPrint('   EventData type: ${eventData.runtimeType}');
            debugPrint('   EventData: $eventData');
            debugPrint('========================================');
            
            // Ensure eventData is a Map
            Map<String, dynamic> bookingData;
            if (eventData is Map<String, dynamic>) {
              bookingData = eventData;
            } else {
              debugPrint('⚠️ EventData is not a Map, converting...');
              bookingData = {'raw': eventData};
            }
            
            // Signal booking/trip lists should be refreshed. Pass type for routing.
            final bookingUpdate = {
              'type': type,
              'data': bookingData,
            };
            debugPrint('📤 Adding to bookingUpdateStream: $bookingUpdate');
            _bookingUpdateController.add(bookingUpdate);
            debugPrint('✅✅✅ Added to bookingUpdateStream ✅✅✅');
            debugPrint('   Stream has ${_bookingUpdateController.hasListener ? "listeners" : "NO listeners"}');
            break;
          default:
            debugPrint('⚠️ Unknown notification type: $type');
        }
      } else {
        debugPrint('❌ Notification data is not a Map: ${data.runtimeType}');
      }
    });

    
    _socket!.onError((error) {
      debugPrint('========================================');
      debugPrint('❌❌❌ SOCKET ERROR! ❌❌❌');
      debugPrint('Error: $error');
      debugPrint('========================================');
    });
    
    _socket!.onReconnect((attemptNumber) {
      debugPrint('========================================');
      debugPrint('🔄 SOCKET RECONNECTED!');
      debugPrint('Attempt number: $attemptNumber');
      debugPrint('========================================');
    });
    
    _socket!.onReconnectAttempt((attemptNumber) {
      debugPrint('🔄 Socket reconnect attempt #$attemptNumber');
    });
    
    _socket!.onReconnectError((error) {
      debugPrint('❌ Socket reconnect error: $error');
    });
    
    _socket!.onReconnectFailed((_) {
      debugPrint('❌❌❌ Socket reconnection FAILED after all attempts!');
    });
    
    // Also listen for 'connect_error' event (different from onConnectError)
    _socket!.on('connect_error', (error) {
      debugPrint('========================================');
      debugPrint('❌ connect_error event: $error');
      debugPrint('========================================');
    });
    
    _socket!.on('error', (error) {
      debugPrint('❌ Socket error event: $error');
    });

    debugPrint('========================================');
    debugPrint('🚀 Socket.IO listeners set up, now connecting explicitly...');
    debugPrint('URL: $kApiBaseUrl');
    debugPrint('Path: /socket.io/');
    debugPrint('Token: ${token.substring(0, 20)}...');
    debugPrint('========================================');
    
    // Now connect explicitly after all listeners are set up
    _socket!.connect();
    
    debugPrint('Socket.connect() called, waiting for connection...');
    debugPrint('Socket state after connect(): connected=${_socket!.connected}, id=${_socket!.id}');
    
    // Add a timeout to detect if connection never happens
    Timer(const Duration(seconds: 10), () {
      if (_socket != null && !_socket!.connected) {
        debugPrint('========================================');
        debugPrint('⚠️⚠️⚠️ SOCKET CONNECTION TIMEOUT! ⚠️⚠️⚠️');
        debugPrint('Socket has not connected after 10 seconds');
        debugPrint('Socket state: connected=${_socket!.connected}, id=${_socket!.id}');
        debugPrint('Attempting manual reconnect...');
        debugPrint('========================================');
        try {
          _socket!.disconnect();
          _socket!.connect();
        } catch (e) {
          debugPrint('❌ Error during manual reconnect: $e');
        }
      }
    });
    
    debugPrint('Waiting for connection to complete...');
  }

  void sendLocationUpdate(double lat, double lng, double heading) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('driver_location_update', {
        'lat': lat,
        'lng': lng,
        'heading': heading,
      });
    }
  }

  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _notificationController.close();
    _walletUpdateController.close();
    _bookingUpdateController.close();
  }
}
