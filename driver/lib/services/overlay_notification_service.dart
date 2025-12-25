import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/trip_models.dart';
import '../widgets/trip_overlay_notification.dart';
import 'socket_service.dart';
import 'token_manager.dart';
import 'trip_service.dart';
import 'native_overlay_service.dart';

/// Service to show overlay notifications for trip offers
/// These appear on top of other apps (like Uber Driver)
class OverlayNotificationService {
  static final OverlayNotificationService _instance = OverlayNotificationService._internal();
  factory OverlayNotificationService() => _instance;
  OverlayNotificationService._internal();

  StreamSubscription? _socketSubscription;
  StreamSubscription? _nativeAcceptSubscription;
  String? _currentToken;
  TripService? _tripService;
  OverlayEntry? _currentOverlay;
  final List<String> _shownTripIds = [];
  BuildContext? _overlayContext;
  String? _pendingAcceptTripId; // Track trip ID that's being accepted
  Timer? _acceptTimeoutTimer; // Timeout for acceptance confirmation
  Timer? _connectionCheckTimer; // Socket connection check timer
  bool _isListenerSetup = false; // Prevent duplicate listener setup
  bool _hasActiveTripInProgress = false; // Track if driver has a trip in progress

  /// Initialize the overlay notification service
  void init(String token, TripService tripService, BuildContext context) {
    debugPrint('[OverlayNotification] ========================================');
    debugPrint('[OverlayNotification] 🚀 INITIALIZING OVERLAY NOTIFICATION SERVICE');
    debugPrint('[OverlayNotification] Token: ${token.substring(0, 20)}...');
    debugPrint('[OverlayNotification] TripService: set');
    debugPrint('[OverlayNotification] Context: set');
    debugPrint('[OverlayNotification] ========================================');
    _currentToken = token;
    _tripService = tripService;
    _overlayContext = context;
    _listenToSocketEvents();
    // Set up native accept listener once during init (prevent race condition from duplicate subscriptions)
    if (_nativeAcceptSubscription == null) {
      _listenToNativeOverlayAccept();
    }
    debugPrint('[OverlayNotification] ✅ Initialization complete');
  }

  void _listenToNativeOverlayAccept() {
    _nativeAcceptSubscription?.cancel();
    _nativeAcceptSubscription = NativeOverlayService().onAccept.listen((tripId) {
      debugPrint('[OverlayNotification] Native overlay accept received for: $tripId');
      _acceptTrip(tripId);
    });
  }

  /// Update the context (call this if the widget tree changes)
  void updateContext(BuildContext context) {
    debugPrint('[OverlayNotification] Updating context');
    _overlayContext = context;
  }

  /// Set whether driver has an active trip in progress
  /// When true, new trip offers will be blocked from showing overlays
  void setActiveTripStatus(bool hasActiveTripInProgress) {
    _hasActiveTripInProgress = hasActiveTripInProgress;
    debugPrint('[OverlayNotification] Active trip status set to: $hasActiveTripInProgress');
    if (hasActiveTripInProgress) {
      debugPrint('[OverlayNotification] 🚫 New trip offers will be blocked until current trip is completed');
    }
  }

  /// Test function to manually show overlay (for debugging)
  void testShowOverlay() {
    debugPrint('[OverlayNotification] Test: Manually triggering overlay');
    final testTrip = TripModel(
      id: 'test-trip-${DateTime.now().millisecondsSinceEpoch}',
      status: 'new',
      pickup: TripLocation(address: 'Test Pickup Location, Test City'),
      drop: TripLocation(address: 'Test Drop Location, Test City'),
      customerName: 'Test Customer',
      fare: 250.0,
      raw: {},
    );
    _showOverlayNotification(testTrip);
  }

  void _listenToSocketEvents() {
    _socketSubscription?.cancel();
    debugPrint('[OverlayNotification] ========================================');
    debugPrint('[OverlayNotification] 🔵 Setting up socket event listener...');
    final socketService = SocketService();
    final isConnected = socketService.isConnected;
    debugPrint('[OverlayNotification] Socket connected: $isConnected');
    debugPrint('[OverlayNotification] Current token: ${_currentToken != null ? "SET" : "NULL"}');
    debugPrint('[OverlayNotification] Trip service: ${_tripService != null ? "SET" : "NULL"}');
    debugPrint('[OverlayNotification] ========================================');
    
    // If socket is not connected, wait for it to connect
    if (!isConnected) {
      debugPrint('[OverlayNotification] ⚠️ Socket not connected yet, will retry when connected');
      // Cancel existing timer if any
      _connectionCheckTimer?.cancel();
      // Set up a one-time listener for when socket connects
      _connectionCheckTimer = Timer.periodic(const Duration(seconds: 2), (timer) {
        if (socketService.isConnected) {
          debugPrint('[OverlayNotification] ✅ Socket connected! Setting up listener now...');
          timer.cancel();
          _connectionCheckTimer = null;
          _listenToSocketEvents(); // Recursively call to set up listener
        } else if (timer.tick > 30) {
          // Give up after 60 seconds (30 ticks * 2 seconds)
          debugPrint('[OverlayNotification] ⚠️ Socket still not connected after 60s, giving up');
          timer.cancel();
          _connectionCheckTimer = null;
        }
      });
      return;
    }
    
    // Listen to booking update stream
    _socketSubscription = socketService.bookingUpdateStream.listen(
      (event) {
        debugPrint('[OverlayNotification] ========================================');
        debugPrint('[OverlayNotification] 📨 RECEIVED SOCKET EVENT');
        debugPrint('[OverlayNotification] Full event: $event');
        debugPrint('[OverlayNotification] ========================================');
        
        final type = event['type']?.toString() ?? '';
        final eventData = event['data'] as Map<String, dynamic>? ?? {};

        debugPrint('[OverlayNotification] Event type: "$type"');
        debugPrint('[OverlayNotification] Event data keys: ${eventData.keys.toList()}');
        debugPrint('[OverlayNotification] Event data sample: ${eventData.toString().substring(0, eventData.toString().length > 300 ? 300 : eventData.toString().length)}');

        if (type == 'NEW_TRIP_OFFER') {
          debugPrint('[OverlayNotification] ✅✅✅ NEW_TRIP_OFFER DETECTED! ✅✅✅');
          
          if (_currentToken == null) {
            debugPrint('[OverlayNotification] ⚠️ No token available');
            return;
          }
          
          if (_tripService == null) {
            debugPrint('[OverlayNotification] ⚠️ No trip service available');
            return;
          }
          
          // Check if driver has an active trip in progress - block new offers
          if (_hasActiveTripInProgress) {
            debugPrint('[OverlayNotification] 🚫 BLOCKING NEW OFFER - Driver has a trip in progress');
            debugPrint('[OverlayNotification] ℹ️ Complete current trip to receive new offers');
            return;
          }
          
          debugPrint('[OverlayNotification] Processing new trip offer...');
          
          // Convert booking/trip data to TripModel
          try {
            debugPrint('[OverlayNotification] Full eventData structure: $eventData');
            
            // The booking data is directly in eventData (backend sends: {"type": "NEW_TRIP_OFFER", "data": booking})
            // So eventData IS the booking object
            final bookingData = eventData;
            
            debugPrint('[OverlayNotification] Booking data keys: ${bookingData.keys}');
            debugPrint('[OverlayNotification] Booking data sample: ${bookingData.toString().substring(0, bookingData.toString().length > 200 ? 200 : bookingData.toString().length)}...');
            
            // Try multiple field name variations (Go struct vs JSON tags)
            final tripId = bookingData['bookingId']?.toString() ?? 
                          bookingData['BookingID']?.toString() ??
                          bookingData['tripId']?.toString() ?? 
                          bookingData['TripID']?.toString() ??
                          bookingData['id']?.toString() ?? 
                          bookingData['ID']?.toString() ?? '';
            
            debugPrint('[OverlayNotification] Extracted trip ID: "$tripId"');
            
            // Don't show duplicate notifications
            if (tripId.isEmpty) {
              debugPrint('[OverlayNotification] ❌ Trip ID is empty, cannot show overlay');
              return;
            }
            
            if (_shownTripIds.contains(tripId)) {
              debugPrint('[OverlayNotification] ⚠️ Trip $tripId already shown, skipping');
              return;
            }

            // Create TripModel from booking data
            debugPrint('[OverlayNotification] 🔄 Attempting to create TripModel...');
            final trip = _createTripModelFromEvent(bookingData);
            if (trip != null) {
              debugPrint('[OverlayNotification] ✅✅✅ Created TripModel successfully!');
              debugPrint('[OverlayNotification] Trip details:');
              debugPrint('[OverlayNotification]   - ID: ${trip.id}');
              debugPrint('[OverlayNotification]   - Fare: ₹${trip.fare}');
              debugPrint('[OverlayNotification]   - Pickup: ${trip.pickup.address}');
              debugPrint('[OverlayNotification]   - Drop: ${trip.drop.address}');
              debugPrint('[OverlayNotification]   - Customer: ${trip.customerName}');
              debugPrint('[OverlayNotification] 🚀 Calling _showOverlayNotification()...');
              _showOverlayNotification(trip);
              _shownTripIds.add(tripId);
              debugPrint('[OverlayNotification] ✅ Trip ID added to shown list: $tripId');
              
              // Remove from shown list after 30 seconds (was 5 minutes)
              // This allows re-showing same trip if user dismisses and backend resends
              Timer(const Duration(seconds: 30), () {
                _shownTripIds.remove(tripId);
                debugPrint('[OverlayNotification] ⏰ Removed trip $tripId from shown list (5 min timeout)');
              });
            } else {
              debugPrint('[OverlayNotification] ❌❌❌ FAILED to create TripModel from event data');
              debugPrint('[OverlayNotification] This usually means the data structure doesn\'t match expected format');
              debugPrint('[OverlayNotification] Full bookingData for debugging:');
              debugPrint('[OverlayNotification] $bookingData');
            }
          } catch (e, stackTrace) {
            debugPrint('[OverlayNotification] ❌ Error processing trip offer: $e');
            debugPrint('[OverlayNotification] Stack trace: $stackTrace');
          }
        } else if (type == 'TRIP_ACCEPTED') {
          // Hide overlay when trip is accepted (either by this driver or another)
          final tripId = eventData['tripId']?.toString() ?? 
                        eventData['bookingId']?.toString() ?? '';
          if (tripId.isNotEmpty) {
            debugPrint('[OverlayNotification] ========================================');
            debugPrint('[OverlayNotification] 🎉 TRIP_ACCEPTED event received for: $tripId');
            debugPrint('[OverlayNotification] 📌 Pending accept trip ID: $_pendingAcceptTripId');
            debugPrint('[OverlayNotification] ========================================');
            
            // Check if this is the trip we just accepted
            if (_pendingAcceptTripId == tripId) {
              debugPrint('[OverlayNotification] ✅ This is the trip we accepted - hiding overlay now');
              _pendingAcceptTripId = null;
              _acceptTimeoutTimer?.cancel();
              
              // Hide both native and in-app overlays
              final nativeOverlay = NativeOverlayService();
              nativeOverlay.hideOverlay();
              _hideOverlay();
            } else {
              debugPrint('[OverlayNotification] ℹ️ Trip accepted by another driver or different trip: $tripId');
              debugPrint('[OverlayNotification] 🚫 Hiding overlay anyway (trip no longer available)');
              
              // Hide both native and in-app overlays
              final nativeOverlay = NativeOverlayService();
              nativeOverlay.hideOverlay();
              _hideOverlay();
            }
            
            _shownTripIds.remove(tripId);
            debugPrint('[OverlayNotification] ✅ Overlay hidden and trip removed from shown list');
          }
        } else {
          debugPrint('[OverlayNotification] Event type "$type" not handled for overlay');
        }
      },
      onError: (error) {
        debugPrint('[OverlayNotification] ❌ Socket stream error: $error');
      },
      onDone: () {
        debugPrint('[OverlayNotification] ⚠️ Socket stream closed');
      },
    );
    
    debugPrint('[OverlayNotification] ✅ Socket listener registered and active');
    debugPrint('[OverlayNotification] Waiting for NEW_TRIP_OFFER events...');
    _isListenerSetup = true;
    // Removed redundant Timer.periodic - connection checking is handled by the initial setup above
  }

  TripModel? _createTripModelFromEvent(Map<String, dynamic> eventData) {
    try {
      debugPrint('[OverlayNotification] ========================================');
      debugPrint('[OverlayNotification] 🔄 _createTripModelFromEvent() called');
      debugPrint('[OverlayNotification] Event data keys: ${eventData.keys.toList()}');
      debugPrint('[OverlayNotification] Event data type: ${eventData.runtimeType}');
      final eventDataStr = eventData.toString();
      final maxLen = eventDataStr.length > 500 ? 500 : eventDataStr.length;
      debugPrint('[OverlayNotification] Full event data (first $maxLen chars): ${maxLen > 0 ? eventDataStr.substring(0, maxLen) : eventDataStr}');
      debugPrint('[OverlayNotification] ========================================');
      
      // Backend sends Go struct field names (BookingID, PickupLocation, etc.)
      // Try both naming conventions
      final bookingId = eventData['bookingId']?.toString() ?? 
                       eventData['BookingID']?.toString() ?? 
                       eventData['tripId']?.toString() ?? 
                       eventData['TripID']?.toString() ?? 
                       eventData['id']?.toString() ?? 
                       DateTime.now().millisecondsSinceEpoch.toString();
      
      // Pickup location - try multiple field names and formats
      dynamic pickupRaw = eventData['pickupLocation'] ?? 
                         eventData['PickupLocation'] ?? 
                         eventData['pickup'] ?? 
                         eventData['pickup_location'] ?? {};
      
      // Drop location - try multiple field names and formats
      dynamic dropRaw = eventData['dropLocation'] ?? 
                       eventData['DropLocation'] ?? 
                       eventData['drop'] ?? 
                       eventData['drop_location'] ?? {};
      
      // Handle JSONB/Map conversion - parse both JSON strings and plain strings
      Map<String, dynamic> pickupLoc = _parseLocation(pickupRaw, 'pickup');
      Map<String, dynamic> dropLoc = _parseLocation(dropRaw, 'drop');
      
      // Extract addresses - try multiple field names
      final pickupAddr = pickupLoc['address']?.toString() ?? 
                        pickupLoc['Address']?.toString() ??
                        pickupLoc['name']?.toString() ?? 
                        pickupLoc['Name']?.toString() ??
                        pickupLoc['formattedAddress']?.toString() ??
                        'Pickup location';
      final dropAddr = dropLoc['address']?.toString() ?? 
                      dropLoc['Address']?.toString() ??
                      dropLoc['name']?.toString() ?? 
                      dropLoc['Name']?.toString() ??
                      dropLoc['formattedAddress']?.toString() ??
                      'Drop location';

      // Extract fare - try multiple field names (backend uses estimatedAmount/finalAmount)
      final fare = _toDouble(eventData['estimatedFare'] ?? 
                             eventData['EstimatedFare'] ??
                             eventData['fare'] ?? 
                             eventData['Fare'] ??
                             eventData['estimatedAmount'] ??
                             eventData['finalAmount'] ??
                             eventData['estimated_fare']);

      // Extract status
      final status = eventData['status']?.toString() ?? 
                    eventData['Status']?.toString() ?? 
                    'new';

      // Extract customer name
      final customerName = eventData['customerName']?.toString() ?? 
                          eventData['CustomerName']?.toString() ??
                          eventData['customer']?['name']?.toString() ??
                          eventData['Customer']?['name']?.toString() ??
                          eventData['customer_name']?.toString() ?? 
                          'Customer';

      debugPrint('[OverlayNotification] ✅ Parsed values:');
      debugPrint('[OverlayNotification]   - Booking ID: $bookingId');
      debugPrint('[OverlayNotification]   - Pickup: $pickupAddr');
      debugPrint('[OverlayNotification]   - Drop: $dropAddr');
      debugPrint('[OverlayNotification]   - Fare: $fare');
      debugPrint('[OverlayNotification]   - Status: $status');
      debugPrint('[OverlayNotification]   - Customer: $customerName');
      
      final tripModel = TripModel(
        id: bookingId,
        status: status,
        pickup: TripLocation(
          address: pickupAddr,
          lat: _toDouble(pickupLoc['lat'] ?? pickupLoc['Lat'] ?? pickupLoc['latitude'] ?? pickupLoc['Latitude']),
          lng: _toDouble(pickupLoc['lng'] ?? pickupLoc['Lng'] ?? pickupLoc['longitude'] ?? pickupLoc['Longitude']),
        ),
        drop: TripLocation(
          address: dropAddr,
          lat: _toDouble(dropLoc['lat'] ?? dropLoc['Lat'] ?? dropLoc['latitude'] ?? dropLoc['Latitude']),
          lng: _toDouble(dropLoc['lng'] ?? dropLoc['Lng'] ?? dropLoc['longitude'] ?? dropLoc['Longitude']),
        ),
        customerName: customerName,
        fare: fare,
        raw: eventData,
      );
      
      debugPrint('[OverlayNotification] ✅✅✅ TripModel created successfully!');
      debugPrint('[OverlayNotification] ========================================');
      return tripModel;
    } catch (e, stackTrace) {
      debugPrint('[OverlayNotification] ========================================');
      debugPrint('[OverlayNotification] ❌❌❌ ERROR creating TripModel ❌❌❌');
      debugPrint('[OverlayNotification] Error: $e');
      debugPrint('[OverlayNotification] Stack trace: $stackTrace');
      debugPrint('[OverlayNotification] ========================================');
      return null;
    }
  }

  /// Parse location data from various formats:
  /// - Map (already parsed JSON)
  /// - JSON string (e.g. '{"address":"Chennai","lat":13.08,"lng":80.27}')
  /// - Plain string (e.g. 'Chennai, Tamil Nadu')
  Map<String, dynamic> _parseLocation(dynamic locationData, String fieldName) {
    if (locationData == null) {
      return {};
    }
    
    if (locationData is Map) {
      return Map<String, dynamic>.from(locationData);
    }
    
    if (locationData is String) {
      final trimmed = locationData.trim();
      
      // Try to parse as JSON first (customer app format)
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          final parsed = json.decode(trimmed);
          if (parsed is Map) {
            debugPrint('[OverlayNotification] ✅ Parsed $fieldName as JSON: $parsed');
            return Map<String, dynamic>.from(parsed);
          }
        } catch (e) {
          debugPrint('[OverlayNotification] ⚠️ Failed to parse $fieldName as JSON: $e');
        }
      }
      
      // Fallback: treat as plain address string (admin dashboard format)
      debugPrint('[OverlayNotification] 📍 Using $fieldName as plain address: $trimmed');
      return {'address': trimmed};
    }
    
    debugPrint('[OverlayNotification] ⚠️ Unknown $fieldName format: ${locationData.runtimeType}');
    return {};
  }

  double? _toDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  /// Public method to manually trigger the overlay (e.g., from HomeTab on startup)
  void showTripOffer(TripModel trip) {
    debugPrint('[OverlayNotification] 🔔 Manually triggering overlay for trip: ${trip.id}');
    _showOverlayNotification(trip);
  }

  void _showOverlayNotification(TripModel trip) async {
    debugPrint('[OverlayNotification] Attempting to show overlay for trip: ${trip.id}');
    
    // Hide any existing overlay first
    _hideOverlay();

    if (_currentToken == null) {
      debugPrint('[OverlayNotification] Error: No token available');
      return;
    }
    if (_tripService == null) {
      debugPrint('[OverlayNotification] Error: No trip service available');
      return;
    }

    // Try native overlay first (floating window over other apps)
    final nativeOverlay = NativeOverlayService();
    debugPrint('[OverlayNotification] ========================================');
    debugPrint('[OverlayNotification] 🔍 STEP 1: Checking overlay permission...');
    final hasPermission = await nativeOverlay.checkOverlayPermission();
    debugPrint('[OverlayNotification] Permission status: $hasPermission');
    debugPrint('[OverlayNotification] ========================================');
    
    if (hasPermission) {
      // Use native floating overlay (like Uber Driver)
      debugPrint('[OverlayNotification] ========================================');
      debugPrint('[OverlayNotification] ✅ STEP 2: Permission granted!');
      debugPrint('[OverlayNotification] Trip details:');
      debugPrint('[OverlayNotification]   - ID: ${trip.id}');
      debugPrint('[OverlayNotification]   - Fare: ₹${trip.fare}');
      debugPrint('[OverlayNotification]   - Pickup: ${trip.pickup.address}');
      debugPrint('[OverlayNotification]   - Drop: ${trip.drop.address}');
      debugPrint('[OverlayNotification]   - Customer: ${trip.customerName}');
      debugPrint('[OverlayNotification] ========================================');
      debugPrint('[OverlayNotification] 🚀 STEP 3: Calling native overlay service...');
      
      final shownTripId = await nativeOverlay.showOverlay(
        tripId: trip.id,
        fare: trip.fare ?? 0.0,
        pickup: trip.pickup.address,
        drop: trip.drop.address,
        customerName: trip.customerName,
      );
      
      debugPrint('[OverlayNotification] ========================================');
      debugPrint('[OverlayNotification] STEP 4: Native overlay response: $shownTripId');
      debugPrint('[OverlayNotification] ========================================');
      
      if (shownTripId != null) {
        debugPrint('[OverlayNotification] ✅✅✅ SUCCESS! Native overlay shown! Trip ID: $shownTripId');
        // Store reference for later dismissal
        _currentOverlay = null; // Native overlay doesn't use OverlayEntry
        
        // NOTE: Accept listener is now set up once in init() to prevent duplicate subscriptions
        
        // Auto-dismiss after 30 seconds UNLESS trip is pending acceptance
        // If trip is being accepted, keep overlay visible until TRIP_ACCEPTED event
        Timer(const Duration(seconds: 30), () {
          if (_pendingAcceptTripId == null || _pendingAcceptTripId != shownTripId) {
            debugPrint('[OverlayNotification] ⏰ Auto-dismissing native overlay after 30 seconds');
            nativeOverlay.hideOverlay();
          } else {
            debugPrint('[OverlayNotification] ⏳ Trip $shownTripId is pending acceptance - keeping overlay visible');
          }
        });
        return;
      } else {
        debugPrint('[OverlayNotification] ❌ Native overlay failed to show, falling back to in-app overlay');
      }
    } else {
      debugPrint('[OverlayNotification] ⚠️ Overlay permission not granted, using in-app overlay');
      debugPrint('[OverlayNotification] 💡 User needs to grant "Display over other apps" permission');
    }

    // Fallback to in-app overlay (only works when app is in foreground)
    if (_overlayContext == null) {
      debugPrint('[OverlayNotification] Error: No overlay context available for fallback');
      return;
    }

    try {
      final overlayState = Overlay.of(_overlayContext!);
      debugPrint('[OverlayNotification] Creating in-app overlay entry...');
      
      // Create overlay entry
      _currentOverlay = OverlayEntry(
        builder: (context) => Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: Material(
            color: Colors.transparent,
            child: SafeArea(
              child: TripOverlayNotification(
                trip: trip,
                token: _currentToken!,
                tripService: _tripService!,
                onAccept: () {
                  debugPrint('[OverlayNotification] Accept button pressed');
                  _hideOverlay();
                  _acceptTrip(trip.id);
                },
                onDismiss: () {
                  debugPrint('[OverlayNotification] Dismiss button pressed');
                  _hideOverlay();
                },
              ),
            ),
          ),
        ),
      );

      // Insert overlay
      overlayState.insert(_currentOverlay!);
      debugPrint('[OverlayNotification] In-app overlay inserted successfully!');

      // Auto-dismiss after 30 seconds UNLESS trip is pending acceptance
      // If trip is being accepted, keep overlay visible until TRIP_ACCEPTED event
      final currentTripId = trip.id; // Capture trip ID for timer closure
      Timer(const Duration(seconds: 30), () {
        if (_pendingAcceptTripId == null || _pendingAcceptTripId != currentTripId) {
          debugPrint('[OverlayNotification] Auto-dismissing in-app overlay after 30 seconds');
          _hideOverlay();
        } else {
          debugPrint('[OverlayNotification] ⏳ Trip $currentTripId is pending acceptance - keeping overlay visible');
        }
      });
    } catch (e, stackTrace) {
      debugPrint('[OverlayNotification] Error showing in-app overlay: $e');
      debugPrint('[OverlayNotification] Stack trace: $stackTrace');
    }
  }

  void _hideOverlay() {
    debugPrint('[OverlayNotification] Hiding overlay...');
    // Clear pending accept state when hiding overlay
    if (_pendingAcceptTripId != null) {
      debugPrint('[OverlayNotification] Clearing pending accept state for: $_pendingAcceptTripId');
      _pendingAcceptTripId = null;
      _acceptTimeoutTimer?.cancel();
    }
    
    // Hide native overlay (OverlayService stays running as a foreground service)
    NativeOverlayService().hideOverlay();
    
    // Hide in-app overlay
    if (_currentOverlay != null) {
      _currentOverlay!.remove();
      _currentOverlay = null;
    }
  }

  Future<void> _acceptTrip(String tripId) async {
    if (_currentToken == null || _tripService == null) {
      debugPrint('[OverlayNotification] Cannot accept trip: missing token or service');
      return;
    }

    if (_pendingAcceptTripId == tripId) {
      debugPrint('[OverlayNotification] Trip $tripId is already pending acceptance, ignoring duplicate accept');
      return;
    }

    try {
      debugPrint('[OverlayNotification] ========================================');
      debugPrint('[OverlayNotification] 🎯 ACCEPTING TRIP: $tripId');
      debugPrint('[OverlayNotification] ========================================');
      
      // Mark this trip as pending acceptance - overlay will stay visible until TRIP_ACCEPTED event
      _pendingAcceptTripId = tripId;
      debugPrint('[OverlayNotification] 📌 Marked trip $tripId as pending acceptance - overlay will stay visible');
      
      // Set a timeout in case TRIP_ACCEPTED event doesn't arrive (30 seconds)
      _acceptTimeoutTimer?.cancel();
      _acceptTimeoutTimer = Timer(const Duration(seconds: 30), () {
        if (_pendingAcceptTripId == tripId) {
          debugPrint('[OverlayNotification] ⏱️ Timeout waiting for TRIP_ACCEPTED event for $tripId');
          debugPrint('[OverlayNotification] ⚠️ Hiding overlay anyway after timeout');
          _pendingAcceptTripId = null;
          _hideOverlay();
        }
      });
      
      // Get a fresh token in case current one expired
      String tokenToUse = _currentToken!;
      try {
        final freshToken = await TokenManager.instance.refreshToken();
        if (freshToken != null) {
          tokenToUse = freshToken;
          _currentToken = freshToken;
          debugPrint('[OverlayNotification] 🔄 Using fresh token for accept request');
        }
      } catch (e) {
        debugPrint('[OverlayNotification] ⚠️ Token refresh failed, using existing token: $e');
      }
      
      await _tripService!.acceptTrip(
        token: tokenToUse,
        tripId: tripId,
      );
      
      debugPrint('[OverlayNotification] ========================================');
      debugPrint('[OverlayNotification] ✅✅✅ TRIP ACCEPT API CALLED SUCCESSFULLY: $tripId');
      debugPrint('[OverlayNotification] ⏳ Waiting for TRIP_ACCEPTED socket event to confirm...');
      debugPrint('[OverlayNotification] 📌 Overlay will remain visible until confirmation received');
      debugPrint('[OverlayNotification] ========================================');
      
      // Hide overlay immediately after successful accept
      _pendingAcceptTripId = null;
      _acceptTimeoutTimer?.cancel();
      _hideOverlay();
      
      debugPrint('[OverlayNotification] ✅ Trip accepted successfully - overlay hidden');
      
    } catch (e, stackTrace) {
      debugPrint('[OverlayNotification] ========================================');
      debugPrint('[OverlayNotification] ❌❌❌ ERROR ACCEPTING TRIP ❌❌❌');
      debugPrint('[OverlayNotification] Trip ID: $tripId');
      debugPrint('[OverlayNotification] Error: $e');
      debugPrint('[OverlayNotification] Stack trace: $stackTrace');
      debugPrint('[OverlayNotification] ========================================');
      
      // On error, clear pending state and hide overlay
      if (_pendingAcceptTripId == tripId) {
        _pendingAcceptTripId = null;
        _acceptTimeoutTimer?.cancel();
        _hideOverlay();
      }
    }
  }

  void dispose() {
    _socketSubscription?.cancel();
    _nativeAcceptSubscription?.cancel();
    _acceptTimeoutTimer?.cancel();
    _connectionCheckTimer?.cancel();
    _hideOverlay();
    _currentToken = null;
    _tripService = null;
    _overlayContext = null;
    _shownTripIds.clear();
    _pendingAcceptTripId = null;
    _isListenerSetup = false;
  }
  /// Handle FCM message data to show overlay
  void handleFcmMessage(Map<String, dynamic> data) {
    try {
      debugPrint('[OverlayNotification] ========================================');
      debugPrint('[OverlayNotification] 📨 RECEIVED FCM MESSAGE');
      debugPrint('[OverlayNotification] Data keys: ${data.keys.toList()}');
      debugPrint('[OverlayNotification] Type: ${data['type']}');
      debugPrint('[OverlayNotification] click_action: ${data['click_action']}');
      debugPrint('[OverlayNotification] Full data: $data');
      debugPrint('[OverlayNotification] ========================================');

      // Check if this is a booking notification - handle both type formats
      final messageType = data['type']?.toString() ?? '';
      if (messageType == 'NEW_TRIP_OFFER' || 
          messageType == 'new-booking' || 
          data['click_action'] == 'FLUTTER_NOTIFICATION_CLICK') {
        
        debugPrint('[OverlayNotification] ✅ Accepted FCM overlay trigger (type: $messageType)');
        
        if (_currentToken == null || _tripService == null) {
          debugPrint('[OverlayNotification] ⚠️ Service not initialized yet, cannot show overlay');
          return;
        }

        // Check if driver has an active trip in progress - block new offers
        if (_hasActiveTripInProgress) {
          debugPrint('[OverlayNotification] 🚫 BLOCKING FCM OFFER - Driver has a trip in progress');
          debugPrint('[OverlayNotification] ℹ️ Complete current trip to receive new offers');
          return;
        }

        // Convert FCM data to TripModel
        // FCM data comes as strings (key: value), while socket data has types
        // We need to parse accordingly
        
        final tripId = data['ids.bookingId']?.toString() ?? 
                       data['bookingId']?.toString() ?? 
                       data['tripId']?.toString() ?? '';
                       
        if (tripId.isEmpty) {
          debugPrint('[OverlayNotification] ❌ No trip ID in FCM data');
          return;
        }
        
        if (_shownTripIds.contains(tripId)) {
          debugPrint('[OverlayNotification] ⚠️ Trip $tripId already shown, skipping');
          return;
        }

        // Extract fare from multiple possible fields
        final fare = data['estimatedPrice']?.toString() ?? 
                     data['fare']?.toString() ?? 
                     data['estimatedFare']?.toString() ?? 
                     '0';

        // Construct event data formatted like socket event for reuse
        final eventData = <String, dynamic>{
          'bookingId': tripId,
          'pickup': data['pickup'] ?? data['pickupLocation'] ?? 'Pickup Location',
          'drop': data['drop'] ?? data['dropLocation'] ?? 'Drop Location',
          'estimatedFare': fare,
          'customerName': data['customerName'] ?? 'Customer',
          'status': 'Booking Confirmed',
          'pickupDateTime': data['pickupDateTime'] ?? '',
          'customerPhone': data['customerPhone'] ?? '',
          // Add other fields as needed
        };
        
        debugPrint('[OverlayNotification] 📋 Constructed event data: $eventData');
        
        final trip = _createTripModelFromEvent(eventData);
        
        if (trip != null) {
          debugPrint('[OverlayNotification] 🚀 Showing overlay from FCM trigger');
          _showOverlayNotification(trip);
          _shownTripIds.add(tripId);
          
          // Remove from dedup set after 30 seconds (was 5 minutes)
          // This allows re-showing same trip if user dismisses and backend resends
          Timer(const Duration(seconds: 30), () {
            _shownTripIds.remove(tripId);
          });
        } else {
          debugPrint('[OverlayNotification] ❌ Failed to create TripModel from FCM data');
        }
      } else {
        debugPrint('[OverlayNotification] ⚠️ Unknown FCM type: $messageType, not showing overlay');
      }
    } catch (e, stackTrace) {
      debugPrint('[OverlayNotification] ❌ Error handling FCM message: $e');
      debugPrint('[OverlayNotification] Stack trace: $stackTrace');
    }
  }
}
