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
    try {
      if (token.isEmpty) {
        debugPrint('[SocketService] ❌ Cannot initialize: token is empty');
        return;
      }
      
      // If socket exists but is disconnected, we can try to reconnect or recreate
      if (_socket != null) {
         if (_socket!.connected) {
            debugPrint('[SocketService] Socket already connected, checking token...');
            // Optional: check if token changed? For now, assume if connected, it's fine.
            return;
         } else {
            debugPrint('[SocketService] Socket exists but DISCONNECTED. Re-initializing...');
            _socket!.dispose();
         }
      }

      _isAuthenticated = false;

      debugPrint('[SocketService] Initializing socket connection to $kApiBaseUrl');
      
      // IMPORTANT: Use WebSocket-only transport
      _socket = io.io(
        kApiBaseUrl,
        io.OptionBuilder()
          .setTransports(['websocket'])  // WebSocket ONLY
          .enableForceNew()
          .disableAutoConnect()
          .setAuth({'token': token})
          .setQuery({'token': token})
          .enableReconnection()
          .setReconnectionAttempts(double.infinity) // Retry forever
          .setReconnectionDelay(3000)
          .build()
      );
      
      debugPrint('[SocketService] Socket instance created, setting up listeners...');
    } catch (e, stackTrace) {
      debugPrint('[SocketService] ❌ Error in init: $e');
      debugPrint('[SocketService] Stack trace: $stackTrace');
      _socket = null;
      return;
    }

    // Set up all listeners BEFORE connecting
    _socket!.onConnect((_) {
      try {
        debugPrint('========================================');
        debugPrint('✅✅✅ SOCKET CONNECTED! ✅✅✅');
        if (_socket != null) {
          debugPrint('Socket ID: ${_socket!.id}');
          debugPrint('Socket connected: ${_socket!.connected}');
        }
        debugPrint('========================================');
        
        // Wait a bit for connection to stabilize, then test if we can receive events
        Future.delayed(const Duration(milliseconds: 500), () {
          try {
            if (_socket != null && _socket!.connected) {
              debugPrint('[SocketService] Testing event reception - sending test emit...');
              // Try to emit a test event to verify bidirectional communication
              _socket!.emit('test', {'message': 'client_test'});
            }
          } catch (e) {
            debugPrint('[SocketService] Error in test emit: $e');
          }
        });
      } catch (e) {
        debugPrint('[SocketService] ❌ Error in onConnect handler: $e');
      }
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
      try {
        debugPrint('========================================');
        debugPrint('🔔 Socket notification received!');
        debugPrint('Raw data type: ${data.runtimeType}');
        debugPrint('Raw data: $data');
        debugPrint('========================================');
        
        if (data is Map<String, dynamic>) {
          handleNotification(data);
        } else if (data != null) {
          debugPrint('[SocketService] ⚠️ Notification data is not a Map, attempting conversion...');
          try {
            final dataMap = Map<String, dynamic>.from(data as Map);
            handleNotification(dataMap);
          } catch (e) {
            debugPrint('[SocketService] ❌ Error converting notification data: $e');
          }
        } else {
          debugPrint('[SocketService] ⚠️ Notification data is null');
        }
      } catch (e, stackTrace) {
        debugPrint('[SocketService] ❌ Error processing notification: $e');
        debugPrint('[SocketService] Stack trace: $stackTrace');
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
  } // End of init

  // Public method to handle notifications (from Socket or FCM)
  void handleNotification(Map<String, dynamic> data) {
    try {
      if (data.isEmpty) {
        debugPrint('[SocketService] ⚠️ Empty notification data received');
        return;
      }
      
      final type = data['type']?.toString() ?? '';
      final eventData = data['data'];
      
      debugPrint('📋 Processing notification (Socket/FCM):');
      debugPrint('   Type: $type');
      debugPrint('   EventData type: ${eventData.runtimeType}');
      debugPrint('   EventData: $eventData');
      
      // Broadcast to general notification stream
      if (!_notificationController.isClosed) {
        _notificationController.add(data);
        debugPrint('✅ Added to notificationStream');
      } else {
        debugPrint('[SocketService] ⚠️ Notification stream is closed');
      }
      
      // Route to specific streams based on type
      switch (type) {
        case 'WALLET_UPDATE':
        case 'WALLET_CREDIT':
          debugPrint('💰 Routing to walletUpdateStream');
          if (eventData is Map<String, dynamic>) {
            if (!_walletUpdateController.isClosed) {
              _walletUpdateController.add(eventData);
            }
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
          } else if (eventData != null) {
            debugPrint('⚠️ EventData is not a Map, converting...');
            try {
              bookingData = Map<String, dynamic>.from(eventData as Map);
            } catch (e) {
              debugPrint('[SocketService] ❌ Error converting eventData: $e');
              bookingData = {'raw': eventData};
            }
          } else {
            debugPrint('⚠️ EventData is null, using empty map');
            bookingData = {};
          }
          
          // Signal booking/trip lists should be refreshed. Pass type for routing.
          final bookingUpdate = {
            'type': type,
            'data': bookingData,
          };
          debugPrint('📤 Adding to bookingUpdateStream: $bookingUpdate');
          if (!_bookingUpdateController.isClosed) {
            _bookingUpdateController.add(bookingUpdate);
            debugPrint('✅✅✅ Added to bookingUpdateStream ✅✅✅');
            debugPrint('   Stream has ${_bookingUpdateController.hasListener ? "listeners" : "NO listeners"}');
          } else {
            debugPrint('[SocketService] ⚠️ Booking update stream is closed');
          }
          break;
        default:
          debugPrint('⚠️ Unknown notification type: $type');
      }
    } catch (e, stackTrace) {
      debugPrint('[SocketService] ❌ Error handling notification: $e');
      debugPrint('[SocketService] Stack trace: $stackTrace');
    }
  }

  void sendLocationUpdate(double lat, double lng, double heading) {
    try {
      if (_socket != null && _socket!.connected) {
        _socket!.emit('driver_location_update', {
          'lat': lat,
          'lng': lng,
          'heading': heading,
        });
      } else {
        debugPrint('[SocketService] ⚠️ Cannot send location update: socket not connected');
      }
    } catch (e) {
      debugPrint('[SocketService] ❌ Error sending location update: $e');
    }
  }

  void dispose() {
    try {
      _socket?.disconnect();
      _socket?.dispose();
      _socket = null;
      _isAuthenticated = false;
      // Do NOT close broadcast controllers as they are final and this is a singleton.
      // Closing them would prevent reuse if the user logs out and back in.
      // _notificationController.close();
      // _walletUpdateController.close();
      // _bookingUpdateController.close();
    } catch (e) {
      debugPrint('[SocketService] ❌ Error disposing socket: $e');
    }
  }
}
