import 'dart:convert';
import 'package:flutter/foundation.dart';

class TripLocation {
  TripLocation({
    required this.address,
    this.lat,
    this.lng,
  });

  final String address;
  final double? lat;
  final double? lng;

  factory TripLocation.fromJson(dynamic raw) {
    if (raw is Map) {
      final map = Map<String, dynamic>.from(raw);
      return TripLocation(
        address: (map['address'] ?? map['name'] ?? '').toString(),
        lat: _toDouble(map['lat']),
        lng: _toDouble(map['lng']),
      );
    }
    if (raw is String && raw.isNotEmpty) {
      // Try to parse as JSON first
      try {
        // ignore: unused_local_variable
        final decoded = _tryJsonDecode(raw);
        if (decoded is Map) {
          return TripLocation.fromJson(decoded);
        }
      } catch (_) {}
      
      return TripLocation(address: raw);
    }
    return TripLocation(address: '');
  }

  static dynamic _tryJsonDecode(String source) {
    if (!source.trim().startsWith('{') && !source.trim().startsWith('[')) {
      throw const FormatException('Not JSON');
    }
    return jsonDecode(source);
  }
}

class TripModel {
  TripModel({
    required this.id,
    required this.status,
    required this.pickup,
    required this.drop,
    required this.customerName,
    required this.raw,
    this.fare,
    this.distance,
    this.gpsDistance,
    this.duration,
    this.startOtp,
    this.endOtp,
    this.startOdometer,
    this.endOdometer,
    this.baseRatePerKm,
    this.vehicleBaseRate,
    this.hillCharge,
    this.tollCharge,
    this.petCharge,
    this.permitCharge,
    this.parkingCharge,
    this.waitingCharge,
    this.taxAmount,
    this.convenienceFee,
    this.discountAmount,
    this.advanceAmount,
    this.tripCompletedTaxAmount,
  });

  final String id;
  final String status;
  final TripLocation pickup;
  final TripLocation drop;
  final String customerName;
  final double? fare;
  final double? distance;
  final double? gpsDistance; // New field for verification
  final int? duration; // Duration in minutes
  final String? startOtp;
  final String? endOtp;
  final double? startOdometer;
  final double? endOdometer;
  final double? baseRatePerKm;
  final double? vehicleBaseRate;
  final double? hillCharge;
  final double? tollCharge;
  final double? petCharge;
  final double? permitCharge;
  final double? parkingCharge;
  final double? waitingCharge;
  final double? taxAmount;
  final double? convenienceFee;
  final double? discountAmount;
  final double? advanceAmount;
  final double? tripCompletedTaxAmount;
  final Map<String, dynamic> raw;

  String get normalizedStatus => status.toLowerCase();

  /// Returns the booking/trip ID
  String get bookingId => id;

  // Updated status checks to match new workflow: NEW → OFFERED → ACCEPTED → NON-STARTED → STARTED → COMPLETED/CANCELLED
  bool get isNew =>
      _matchesStatus(['pending', 'booking confirmed', 'booking_confirmed', 'new', 'offered']);

  bool get isOffered => _matchesStatus(['offered']);

  bool get isAccepted => _matchesStatus(['accepted']);

  bool get isNotStarted => _matchesStatus(['not-started', 'non-started', 'accepted']);

  bool get isStarted => _matchesStatus(['started', 'in_progress']);

  bool get isCompleted =>
      _matchesStatus(['completed', 'manual completed', 'manual_completed']);

  bool get isCancelled => _matchesStatus(['cancelled']);

  // Additional getters for booking details popup
  String get serviceType => (raw['serviceType'] ?? raw['service_type'] ?? raw['vehicleType'] ?? 'N/A').toString();
  
  String get customerPhone => (raw['customer']?['phone'] ?? raw['customerPhone'] ?? raw['phone'] ?? '').toString();
  
  String? get pickupDate => (raw['pickupDateTime'] ?? raw['pickupDate'] ?? raw['pickup_date'])?.toString();
  
  String get pickupTime {
    final dateTime = raw['pickupDateTime'] ?? raw['pickupDate'];
    if (dateTime == null) return 'N/A';
    try {
      final parsed = DateTime.parse(dateTime.toString());
      final hour = parsed.hour;
      final minute = parsed.minute.toString().padLeft(2, '0');
      final amPm = hour >= 12 ? 'PM' : 'AM';
      final hour12 = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
      return '$hour12:$minute $amPm';
    } catch (_) {
      return raw['pickupTime']?.toString() ?? 'N/A';
    }
  }
  
  double? get extraCharges {
    // Sum of all extra charges
    final charges = [hillCharge, tollCharge, petCharge, permitCharge, parkingCharge, waitingCharge];
    double total = 0;
    bool hasAny = false;
    for (final c in charges) {
      if (c != null && c > 0) {
        total += c;
        hasAny = true;
      }
    }
    return hasAny ? total : null;
  }

  factory TripModel.fromJson(Map<String, dynamic> json) {
    final data = Map<String, dynamic>.from(json);
    final pickup = TripLocation.fromJson(
      data['pickup'] ?? data['pickupLocation'],
    );
    final drop = TripLocation.fromJson(
      data['drop'] ?? data['dropLocation'],
    );

    final id = (data['tripId'] ??
            data['bookingId'] ??
            data['_id'] ??
            data['id'])
        .toString();

    // Parse extra charges - check both top-level and extraCharges object
    final extraCharges = data['extraCharges'];
    final extraChargesMap = extraCharges is Map<String, dynamic>
        ? Map<String, dynamic>.from(extraCharges)
        : <String, dynamic>{};

    // Helper to convert camelCase to snake_case
    String camelToSnake(String camelCase) {
      final buffer = StringBuffer();
      for (int i = 0; i < camelCase.length; i++) {
        final char = camelCase[i];
        if (char == char.toUpperCase() && i > 0) {
          buffer.write('_');
        }
        buffer.write(char.toLowerCase());
      }
      return buffer.toString();
    }

    // Helper to get charge value from either top-level or extraCharges object
    double? getCharge(String key) {
      // First try top-level (camelCase) - check if key exists (even if value is 0)
      if (data.containsKey(key)) {
        final value = data[key];
        if (value != null) {
          final topLevel = _toDouble(value);
          if (topLevel != null) {
            debugPrint('[TripModel] Found $key at top-level: $topLevel');
            return topLevel;
          }
        }
      }
      // Try snake_case version (for backward compatibility)
      final snakeKey = camelToSnake(key);
      if (data.containsKey(snakeKey)) {
        final value = data[snakeKey];
        if (value != null) {
          final snakeLevel = _toDouble(value);
          if (snakeLevel != null) {
            debugPrint('[TripModel] Found $key as $snakeKey at top-level: $snakeLevel');
            return snakeLevel;
          }
        }
      }
      // Then try extraCharges object (camelCase)
      if (extraChargesMap.containsKey(key)) {
        final value = extraChargesMap[key];
        if (value != null) {
          final fromExtra = _toDouble(value);
          if (fromExtra != null) {
            debugPrint('[TripModel] Found $key in extraCharges: $fromExtra');
            return fromExtra;
          }
        }
      }
      // Try extraCharges object (snake_case)
      if (extraChargesMap.containsKey(snakeKey)) {
        final value = extraChargesMap[snakeKey];
        if (value != null) {
          final fromExtra = _toDouble(value);
          if (fromExtra != null) {
            debugPrint('[TripModel] Found $key as $snakeKey in extraCharges: $fromExtra');
            return fromExtra;
          }
        }
      }
      debugPrint('[TripModel] Charge $key not found in any location');
      return null;
    }

    return TripModel(
      id: id,
      status: (data['status'] ?? '').toString(),
      pickup: pickup,
      drop: drop,
      customerName: (data['customer']?['name'] ??
              data['customerName'] ??
              data['customer_name'] ??
              'Customer')
          .toString(),
      fare: _firstDouble([
        data['finalAmount'],
        data['estimatedFare'],
        data['fare'],
        data['amount'],
      ]),
      distance: _firstDouble([
        data['distance'],
        data['totalDistance'],
        data['total_distance'],
        data['estimatedDistance'],
        data['estimated_distance'],
      ]),
      gpsDistance: _firstDouble([
        data['gpsDistance'],
        data['gps_distance'],
      ]),
      duration: data['duration'] is int
          ? data['duration'] as int?
          : (data['duration'] is num
              ? (data['duration'] as num).toInt()
              : null),
      startOtp: data['startOtp']?.toString(),
      endOtp: data['endOtp']?.toString(),
      startOdometer: _toDouble(data['startOdometerValue'] ?? data['startOdometer']),
      endOdometer: _toDouble(data['endOdometerValue'] ?? data['endOdometer']),
      baseRatePerKm: _firstDouble([
        data['baseRatePerKm'],
        data['pricePerKm'],
        data['price_per_km'],
        data['ratePerKm'],
        data['rate_per_km'],
        // Also check nested fare objects
        (data['normalFare'] is Map) ? data['normalFare']['pricePerKm'] : null,
        (data['modifiedFare'] is Map) ? data['modifiedFare']['pricePerKm'] : null,
      ]),
      // Vehicle Base Rate / Driver Beta - check multiple field names
      vehicleBaseRate: _firstDouble([
        data['vehicleBaseRate'],
        data['tripCompletedDriverBeta'],
        data['driverBeta'],
        data['driver_beta'],
      ]),
      // Hill, Toll, Permit are stored in separate columns (extraHill, extraToll, extraPermitCharge)
      hillCharge: _firstDouble([
        data['hillCharge'],
        data['extraHill'],
        data['extra_hill'],
        getCharge('hillCharge'),
      ]),
      tollCharge: _firstDouble([
        data['tollCharge'],
        data['extraToll'],
        data['extra_toll'],
        getCharge('tollCharge'),
      ]),
      // Pet, Parking, Waiting are in extraCharges JSON
      petCharge: getCharge('petCharge'),
      permitCharge: _firstDouble([
        data['permitCharge'],
        data['extraPermitCharge'],
        data['extra_permit_charge'],
        getCharge('permitCharge'),
      ]),
      parkingCharge: getCharge('parkingCharge'),
      waitingCharge: getCharge('waitingCharge'),
      taxAmount: _firstDouble([
        data['taxAmount'],
        data['gst'], // Sometimes returned as gst in commission breakup
        data['tripCompletedTaxAmount'],
      ]),
      convenienceFee: _toDouble(data['convenienceFee']),
      discountAmount: _toDouble(data['discountAmount']),
      advanceAmount: _toDouble(data['advanceAmount']),
      tripCompletedTaxAmount: _toDouble(data['tripCompletedTaxAmount']),
      raw: data,
    );
  }

  bool _matchesStatus(List<String> candidates) {
    final statusLower = normalizedStatus;
    return candidates.any((s) => statusLower == s.toLowerCase());
  }
}

class LiveTrips {
  LiveTrips({
    required this.offers,
    required this.count,
  });

  final List<TripModel> offers;
  final int count;

  factory LiveTrips.fromJson(Map<String, dynamic> json) {
    final offers = (json['offers'] as List<dynamic>? ?? [])
        .map((item) => TripModel.fromJson(Map<String, dynamic>.from(item)))
        .toList();
    final count = json['count'] is int ? json['count'] as int : offers.length;
    return LiveTrips(offers: offers, count: count);
  }
}

double? _toDouble(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

double? _firstDouble(List<dynamic> values) {
  for (final v in values) {
    final parsed = _toDouble(v);
    if (parsed != null) return parsed;
  }
  return null;
}
