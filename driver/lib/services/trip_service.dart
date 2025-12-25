import '../api_client.dart';
import '../models/trip_models.dart';
import 'package:flutter/foundation.dart';
import 'dart:convert';

const String kTripStatusNew = 'Booking Confirmed';
// Backend trip table uses "accepted" for upcoming/not-started. Keep UI label "Not Started".
const String kTripStatusNotStarted = 'accepted';
const String kTripStatusStarted = 'Started';
const String kTripStatusCompleted = 'Completed';
const String kTripStatusCancelled = 'Cancelled';

class TripService {
  TripService({
    ApiClient? apiClient,
    this.notStartedStatus = kTripStatusNotStarted,
    this.newStatus = kTripStatusNew,
  }) : _api = apiClient ?? ApiClient(baseUrl: kApiBaseUrl);

  final ApiClient _api;
  final String notStartedStatus;
  final String newStatus;

  Future<LiveTrips> getLiveTrips(String token) async {
    try {
      // Backend uses bookings table - use booking API for new offers
      // Get bookings with "Booking Confirmed" status (new offers)
      _log('[TripService] ========================================');
      _log('[TripService] 🔄 Fetching live trips (Booking Confirmed)...');
      _log('[TripService] Status: booking-confirmed');
      _log('[TripService] ========================================');
      
      final res = await _api.getBookingsByStatus(token: token, status: 'booking-confirmed');
      
      _log('[TripService] 📡 Live trips API response:');
      _log('[TripService]   - Success: ${res.success}');
      _log('[TripService]   - Status Code: ${res.statusCode}');
      _log('[TripService]   - Full body: ${res.body}');
      
      _ensureSuccess(res, 'fetch live trips');
      
      final data = res.body['data'];
      if (data == null) {
        _log('[TripService] ⚠️ No data in response, returning empty list');
        return LiveTrips(offers: [], count: 0);
      }
      
      _log('[TripService] Data type: ${data.runtimeType}');
      _log('[TripService] Data: $data');
      
      final listData = _extractList(data);
      _log('[TripService] ✅ Found ${listData.length} live trips');
      
      final trips = listData
          .map((item) {
            try {
              return TripModel.fromJson(Map<String, dynamic>.from(item));
            } catch (e) {
              _log('[TripService] ⚠️ Failed to parse trip item: $e');
              _log('[TripService] Item data: $item');
              return null;
            }
          })
          .whereType<TripModel>()
          .toList();
      
      return LiveTrips(offers: trips, count: trips.length);
    } catch (e) {
      _log('[TripService] ❌ Error fetching live trips: $e');
      rethrow;
    }
  }

  Future<List<TripModel>> getTripsByStatus({
    required String token,
    required String status,
  }) async {
    try {
      // Backend uses bookings table, not trips table
      // Map UI status to booking API status
      final bookingStatus = _toBookingStatus(status);
      
      _log('[TripService] 🔄 Fetching trips by status: $status (mapped to: $bookingStatus)');
      
      // Use booking API endpoint for all statuses
      final res = await _api.getBookingsByStatus(token: token, status: bookingStatus);
      
      _log('[TripService] 📡 Trips by status API response:');
      _log('[TripService]   - Success: ${res.success}');
      _log('[TripService]   - Status Code: ${res.statusCode}');
      
      _ensureSuccess(res, 'fetch bookings by status');
      
      final data = res.body['data'];
      if (data == null) {
        _log('[TripService] ⚠️ No data in response, returning empty list');
        return [];
      }
      
      final listData = _extractList(data);
      _log('[TripService] ✅ Found ${listData.length} trips with status: $bookingStatus');
      
      return listData
          .map((item) {
            try {
              return TripModel.fromJson(Map<String, dynamic>.from(item));
            } catch (e) {
              _log('[TripService] ⚠️ Failed to parse trip item: $e');
              _log('[TripService] Item data: $item');
              return null;
            }
          })
          .whereType<TripModel>()
          .toList();
    } catch (e) {
      _log('[TripService] ❌ Error fetching trips by status: $e');
      rethrow;
    }
  }

  Future<TripModel?> getTripDetails({
    required String token,
    required String tripId,
  }) async {
    try {
      _log('[TripService] 🔄 Fetching trip details for ID: $tripId');
      
      final res = await _api.getTripSummary(token: token, tripId: tripId);
      _ensureSuccess(res, 'fetch trip details');
      
      final data = res.body['data'];
      if (data == null) {
        _log('[TripService] ⚠️ No data in response');
        return null;
      }
      
      _log('[TripService] ✅ Trip details fetched successfully');
      // The response structure might be { data: { trip: {...} } } or directly { data: {...} }
      // Adjust based on common patterns or check response
      // The response structure is { data: { tripDetails: {...}, customerDetails: {...}, ... } }
      final tripDetails = data['tripDetails'] ?? data['trip'] ?? data;
      final customerDetails = data['customerDetails'];
      
      final Map<String, dynamic> mergedData = Map<String, dynamic>.from(tripDetails);
      
      // Merge customer details if available
      if (customerDetails != null) {
        mergedData['customer'] = customerDetails;
        mergedData['customerName'] = customerDetails['name'];
      }
      
      return TripModel.fromJson(mergedData);
    } catch (e) {
      _log('[TripService] ❌ Error fetching trip details: $e');
      rethrow;
    }
  }

  Future<Map<String, int>> getTripCounts(String token) async {
    // Fetch from backend - it now handles deduplication of trips and bookings
    // The backend excludes bookings that have corresponding trips to avoid double counting
    try {
      _log('[TripService] ========================================');
      _log('[TripService] 🔄 Fetching trip counts from API...');
      _log('[TripService] ========================================');
      
      final res = await _api.fetchTripCounts(token: token);
      
      _log('[TripService] 📡 API Response:');
      _log('[TripService]   - Success: ${res.success}');
      _log('[TripService]   - Status Code: ${res.statusCode}');
      _log('[TripService]   - Raw body: ${res.body}');
      
      if (!res.success) {
        final errorMsg = res.body['message']?.toString() ?? 
                        res.body['error']?.toString() ?? 
                        'Unknown error';
        _log('[TripService] ❌ API request failed: $errorMsg');
        _log('[TripService] Full response: ${res.body}');
        throw Exception('Failed to fetch trip counts: $errorMsg');
      }

      final data = res.body['data'];
      if (data == null) {
        _log('[TripService] ⚠️ No data field in response');
        throw Exception('Invalid response format: missing data field');
      }
      
      if (data is! Map<String, dynamic>) {
        _log('[TripService] ⚠️ Data field is not a map: ${data.runtimeType}');
        throw Exception('Invalid response format: data field is not a map');
      }
      
      _log('[TripService] 📊 Parsed data from API:');
      _log('[TripService]   - Data type: ${data.runtimeType}');
      _log('[TripService]   - Data keys: ${data.keys.toList()}');
      _log('[TripService]   - Raw data values: $data');
      
      final counts = {
        'offers': _parseInt(data['new-bookings'], 'offers'),
        'accepted': _parseInt(data['not-started'], 'accepted'),
        'started': _parseInt(data['started'], 'started'),
        'completed': _parseInt(data['completed'], 'completed'),
        'cancelled': _parseInt(data['cancelled'], 'cancelled'),
      };
      
      _log('[TripService] ✅ Final parsed counts:');
      _log('[TripService]   - offers: ${counts['offers']}');
      _log('[TripService]   - accepted: ${counts['accepted']}');
      _log('[TripService]   - started: ${counts['started']}');
      _log('[TripService]   - completed: ${counts['completed']}');
      _log('[TripService]   - cancelled: ${counts['cancelled']}');
      _log('[TripService] ========================================');
      
      return counts;
    } on Exception catch (e) {
      _log('[TripService] ❌ Exception fetching trip counts: $e');
      rethrow;
    } catch (e, stackTrace) {
      _log('[TripService] ❌ Unexpected error fetching trip counts: $e');
      _log('[TripService] Stack trace: $stackTrace');
      throw Exception('Unexpected error: ${e.toString()}');
    }
  }

  int _parseInt(dynamic value, String fieldName) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) {
      final parsed = int.tryParse(value);
      if (parsed != null) return parsed;
      _log('[TripService] ⚠️ Failed to parse $fieldName as int: $value');
    }
    _log('[TripService] ⚠️ Invalid type for $fieldName: ${value.runtimeType}');
    return 0;
  }

  // Note: getTripsByStatus is defined above (line 74) - use that method

  Future<void> acceptTrip({
    required String token,
    required String tripId,
  }) async {
    _log('[TripService] ========================================');
    _log('[TripService] 🎯 ACCEPTING TRIP');
    _log('[TripService] Trip ID: $tripId');
    _log('[TripService] Is booking: ${tripId.startsWith('booking-')}');
    _log('[TripService] ========================================');
    
    try {
      // If it's a booking request (starts with booking-), use the booking API
      if (tripId.startsWith('booking-')) {
        _log('[TripService] 📞 Calling respondBooking API for: $tripId');
        final res = await _api.respondBooking(
          token: token,
          bookingId: tripId,
          accept: true,
        );
        _log('[TripService] ✅ respondBooking response received');
        _log('[TripService] Response status: ${res.statusCode}');
        _log('[TripService] Response body: ${res.body}');
        _ensureSuccess(res, 'accept booking');
        _log('[TripService] ✅✅✅ BOOKING ACCEPTED SUCCESSFULLY: $tripId');
      } else {
        _log('[TripService] 📞 Calling acceptTrip API for: $tripId');
        final res = await _api.acceptTrip(token: token, tripId: tripId);
        _log('[TripService] ✅ acceptTrip response received');
        _log('[TripService] Response status: ${res.statusCode}');
        _log('[TripService] Response body: ${res.body}');
        _ensureSuccess(res, 'accept trip');
        _log('[TripService] ✅✅✅ TRIP ACCEPTED SUCCESSFULLY: $tripId');
      }
    } catch (e, stackTrace) {
      _log('[TripService] ========================================');
      _log('[TripService] ❌❌❌ ERROR ACCEPTING TRIP ❌❌❌');
      _log('[TripService] Trip ID: $tripId');
      _log('[TripService] Error: $e');
      _log('[TripService] Stack trace: $stackTrace');
      _log('[TripService] ========================================');
      rethrow;
    }
  }

  Future<void> startTrip({
    required String token,
    required String tripId,
    required String otp,
    required double startOdometer, // Now required, not optional
    String? startOdometerImage,
    String? accessToken, // Added for Widget flow
  }) async {
    // Validate required fields
    if (otp.isEmpty) {
      throw Exception('Start OTP is required');
    }
    if (startOdometer <= 0) {
      throw Exception('Start odometer reading is required and must be greater than 0');
    }

    final res = await _api.startTrip(
      token: token, 
      tripId: tripId, 
      otp: otp, 
      startOdometer: startOdometer,
      startOdometerImage: startOdometerImage,
      accessToken: accessToken,
    );
    _ensureSuccess(res, 'start trip');
  }

  Future<void> endTrip({
    required String token,
    required String tripId,
    required String endOtp, // Now required
    required double distance,
    required int duration,
    required double endOdometer, // Now required, not optional
    Map<String, dynamic>? driverCharges,
    List<Map<String, dynamic>>? gpsPoints, // GPS trail from TripTrackingService
    String? accessToken, // Added for Widget flow
    // Extra charges as separate fields
    double? hillCharge,
    double? tollCharge,
    double? petCharge,
    double? permitCharge,
    double? parkingCharge,
    double? waitingCharge,
  }) async {
    // Validate required fields
    if (endOtp.isEmpty) {
      throw Exception('End OTP is required');
    }
    if (endOdometer <= 0) {
      throw Exception('End odometer reading is required and must be greater than 0');
    }

    final res = await _api.endTrip(
      token: token,
      tripId: tripId,
      endOtp: endOtp,
      distance: distance,
      duration: duration,
      endOdometer: endOdometer,
      driverCharges: driverCharges,
      gpsPoints: gpsPoints,
      accessToken: accessToken,
      // Pass extra charges to API
      hillCharge: hillCharge,
      tollCharge: tollCharge,
      petCharge: petCharge,
      permitCharge: permitCharge,
      parkingCharge: parkingCharge,
      waitingCharge: waitingCharge,
    );
    _ensureSuccess(res, 'end trip');
  }

  Future<void> completeTrip({
    required String token,
    required String tripId,
    required double fare,
    String paymentMethod = 'Cash', // Default to Cash, backend accepts: "Cash", "Link", or "UPI"
    double? hillCharge,
    double? tollCharge,
    double? petCharge,
    double? permitCharge,
    double? parkingCharge,
    double? waitingCharge,
  }) async {
    // Validate payment method
    final validMethods = ['Cash', 'Link', 'UPI'];
    final finalPaymentMethod = validMethods.contains(paymentMethod) ? paymentMethod : 'Cash';
    
    final res = await _api.completeTrip(
      token: token,
      tripId: tripId,
      paymentMethod: finalPaymentMethod,
      fare: fare,
      hillCharge: hillCharge,
      tollCharge: tollCharge,
      petCharge: petCharge,
      permitCharge: permitCharge,
      parkingCharge: parkingCharge,
      waitingCharge: waitingCharge,
    );
    _ensureSuccess(res, 'complete trip');
  }

  Future<void> cancelTrip({
    required String token,
    required String tripId,
    required String reason,
    String? type, // customer, driver, vendor, auto-expired
  }) async {
    final res = await _api.cancelTrip(
      token: token,
      tripId: tripId,
      reason: reason,
      type: type,
    );
    _ensureSuccess(res, 'cancel trip');
  }

  /// Check if driver has an active trip (Started or Not-Started)
  /// Returns the active trip if found, prioritizing Started trips over Not-Started
  /// This is used to:
  /// 1. Show active trip banner on home screen
  /// 2. Block new trip offers when a trip is in progress
  Future<TripModel?> getActiveTrip(String token) async {
    try {
      _log('[TripService] ========================================');
      _log('[TripService] 🔍 Checking for active trips...');
      _log('[TripService] ========================================');

      // 1. Check for Started trips first (highest priority - trip in progress)
      final startedTrips = await getTripsByStatus(token: token, status: 'started');
      if (startedTrips.isNotEmpty) {
        _log('[TripService] ✅ Found ${startedTrips.length} started trips');
        _log('[TripService] Returning first started trip: ${startedTrips.first.bookingId}');
        return startedTrips.first;
      }

      // 2. Check for Not-Started trips (accepted but not yet started)
      final notStartedTrips = await getTripsByStatus(token: token, status: 'not-started');
      if (notStartedTrips.isNotEmpty) {
        _log('[TripService] ✅ Found ${notStartedTrips.length} not-started trips');
        _log('[TripService] Returning first not-started trip: ${notStartedTrips.first.bookingId}');
        return notStartedTrips.first;
      }

      _log('[TripService] ℹ️ No active trips found');
      return null;
    } catch (e) {
      _log('[TripService] ❌ Error checking active trips: $e');
      return null; // Return null on error to not block the app
    }
  }

  /// Check if driver has a trip in progress (status = Started)
  /// Returns true if a trip is currently in progress
  bool hasTripInProgress(TripModel? activeTrip) {
    if (activeTrip == null) return false;
    final status = activeTrip.status?.toLowerCase() ?? '';
    return status == 'started';
  }


  List<dynamic> _extractList(dynamic data) {
    if (data is Map<String, dynamic>) {
      if (data['trips'] is List<dynamic>) return data['trips'] as List<dynamic>;
      if (data['bookings'] is List<dynamic>) return data['bookings'] as List<dynamic>;
    }
    if (data is List<dynamic>) return data;
    return const [];
  }


  // Map UI status to Booking API status format (lowercase with hyphens)
  // Backend uses switch with lowercase values like "booking-confirmed", "not-started"
  String _toBookingStatus(String uiStatus) {
    final statusMap = {
      'booking confirmed': 'booking-confirmed',
      'booking-confirmed': 'booking-confirmed',
      'new': 'booking-confirmed',
      'pending': 'booking-confirmed',
      'offered': 'booking-confirmed',
      'not-started': 'not-started',
      'non-started': 'not-started',
      'not started': 'not-started',
      'accepted': 'not-started', // accepted maps to Not-Started in bookings
      'started': 'started',
      'completed': 'completed',
      'cancelled': 'cancelled',
    };
    return statusMap[uiStatus.toLowerCase()] ?? uiStatus.toLowerCase().replaceAll(' ', '-');
  }


  void _ensureSuccess(ApiResult res, String context) {
    if (!res.success) {
      // Try to extract error message from response
      String errorMessage = 'Request failed';
      
      // Log full response for debugging first
      _log('[TripService] ❌ API call failed: $context');
      _log('[TripService]   - Status Code: ${res.statusCode}');
      _log('[TripService]   - ApiResult.message: ${res.message}');
      _log('[TripService]   - ApiResult.data type: ${res.data.runtimeType}');
      _log('[TripService]   - ApiResult.data: ${res.data}');
      _log('[TripService]   - ApiResult.body type: ${res.body.runtimeType}');
      _log('[TripService]   - ApiResult.body: ${res.body}');
      
      // Extract error message from body
      if (res.data is Map) {
        final body = res.data as Map;
        
        // Handle validation errors array (backend returns message as array for validation errors)
        if (body['message'] != null) {
          final messageValue = body['message'];
          _log('[TripService]   - body[message] type: ${messageValue.runtimeType}');
          _log('[TripService]   - body[message] value: $messageValue');
          
          // If message is an array (validation errors), extract messages
          if (messageValue is List) {
            final errorMessages = <String>[];
            for (var item in messageValue) {
              if (item is Map) {
                // Extract message from error object: { field: "...", message: "..." }
                final msg = item['message']?.toString() ?? '';
                if (msg.isNotEmpty) {
                  errorMessages.add(msg);
                }
              } else {
                errorMessages.add(item.toString());
              }
            }
            if (errorMessages.isNotEmpty) {
              errorMessage = errorMessages.join('. ');
            }
          } 
          // If message is a string, use it directly
          else if (messageValue is String) {
            errorMessage = messageValue;
          }
          // If message is something else, convert to string
          else {
            errorMessage = messageValue.toString();
          }
        }
        
        // Fallback to other error fields
        if (errorMessage == 'Request failed' || errorMessage.isEmpty) {
          errorMessage = body['error']?.toString() ??
                        body['msg']?.toString() ??
                        body['errorMessage']?.toString() ??
                        'Request failed';
        }
        
        // For 400 errors, try to get more specific validation errors
        if (res.statusCode == 400) {
          // Check for validation errors array in 'errors' field
          if (body['errors'] != null && body['errors'] is List) {
            final errors = (body['errors'] as List).map((e) {
              if (e is Map) {
                return e['message']?.toString() ?? e.toString();
              }
              return e.toString();
            }).join(', ');
            if (errors.isNotEmpty) {
              errorMessage = errors;
            }
          }
          // Check for nested error object
          else if (body['error'] is Map) {
            final errorMap = body['error'] as Map;
            errorMessage = errorMap['message']?.toString() ?? 
                          errorMap['msg']?.toString() ?? 
                          errorMessage;
          }
          
          // If still generic, provide context-specific message
          if (errorMessage == 'Request failed' || errorMessage.isEmpty) {
            if (context.contains('start trip')) {
              errorMessage = 'Unable to start trip. Please check your OTP and odometer reading.';
            } else if (context.contains('end trip')) {
              errorMessage = 'Unable to end trip. Please check your OTP and odometer reading.';
            } else if (context.contains('accept')) {
              errorMessage = 'Unable to accept booking. Please try again.';
            } else {
              errorMessage = 'Request failed. Please check your input and try again.';
            }
          }
        }
      }
      // Fallback to ApiResult message (but it might be array string representation)
      else if (res.message.isNotEmpty) {
        // Check if message looks like an array string representation
        if (res.message.startsWith('[') && res.message.contains('message')) {
          // Try to parse it
          try {
            final parsed = jsonDecode(res.message);
            if (parsed is List) {
              final errorMessages = <String>[];
              for (var item in parsed) {
                if (item is Map) {
                  final msg = item['message']?.toString() ?? '';
                  if (msg.isNotEmpty) {
                    errorMessages.add(msg);
                  }
                }
              }
              if (errorMessages.isNotEmpty) {
                errorMessage = errorMessages.join('. ');
              }
            }
          } catch (_) {
            // If parsing fails, use as-is
            errorMessage = res.message;
          }
        } else {
          errorMessage = res.message;
        }
      }

      if (res.statusCode == 400 && (errorMessage == 'Request failed' || errorMessage.isEmpty)) {
        if (context.contains('start trip')) {
          errorMessage = 'Unable to start trip. Please check your OTP and odometer reading.';
        } else if (context.contains('end trip')) {
          errorMessage = 'Unable to end trip. Please check your OTP and odometer reading.';
        } else if (context.contains('accept')) {
          errorMessage = 'Unable to accept booking. Please try again.';
        } else {
          errorMessage = 'Request failed. Please check your input and try again.';
        }
      }
      
      // Final log
      _log('[TripService]   - Final Error Message: $errorMessage');
      
      throw Exception('$context: $errorMessage');
    }
  }

  void _log(String message) {
    debugPrint(message);
  }

}
