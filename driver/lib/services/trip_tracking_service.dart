import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

/// GPS point with timestamp for trip tracking
class GpsPoint {
  final double lat;
  final double lng;
  final DateTime timestamp;

  GpsPoint({
    required this.lat,
    required this.lng,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
    'lat': lat,
    'lng': lng,
    'timestamp': timestamp.toIso8601String(),
  };

  factory GpsPoint.fromPosition(Position position) {
    return GpsPoint(
      lat: position.latitude,
      lng: position.longitude,
      timestamp: DateTime.now(),
    );
  }
}

/// Service to track GPS during active trips
/// 
/// Usage:
/// 1. Call `startTracking(tripId)` when trip starts
/// 2. Call `stopTracking()` when trip ends
/// 3. Use `calculateDistance()` to get total distance in km
/// 4. Use `getGpsPoints()` to get all recorded points
class TripTrackingService {
  static final TripTrackingService _instance = TripTrackingService._internal();
  factory TripTrackingService() => _instance;
  TripTrackingService._internal();

  // Tracking state
  String? _currentTripId;
  Timer? _trackingTimer;
  final List<GpsPoint> _gpsPoints = [];
  bool _isTracking = false;
  DateTime? _startTime;
  
  // Configuration
  static const Duration trackingInterval = Duration(minutes: 1);
  
  /// Check if tracking is active
  bool get isTracking => _isTracking;
  
  /// Get current trip ID being tracked
  String? get currentTripId => _currentTripId;
  
  /// Get trip duration
  Duration get tripDuration {
    if (_startTime == null) return Duration.zero;
    return DateTime.now().difference(_startTime!);
  }
  
  /// Get all recorded GPS points
  List<GpsPoint> get gpsPoints => List.unmodifiable(_gpsPoints);
  
  /// Start tracking GPS for a trip
  Future<bool> startTracking(String tripId) async {
    if (_isTracking) {
      debugPrint('[TripTracking] Already tracking trip: $_currentTripId');
      return false;
    }
    
    // Check location permission
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        debugPrint('[TripTracking] Location permission denied');
        return false;
      }
    }
    
    if (permission == LocationPermission.deniedForever) {
      debugPrint('[TripTracking] Location permission permanently denied');
      return false;
    }
    
    // Check if location services are enabled
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      debugPrint('[TripTracking] Location services disabled');
      return false;
    }
    
    _currentTripId = tripId;
    _gpsPoints.clear();
    _startTime = DateTime.now();
    _isTracking = true;
    
    debugPrint('[TripTracking] ========================================');
    debugPrint('[TripTracking] 🚗 Started tracking for trip: $tripId');
    debugPrint('[TripTracking] ========================================');
    
    // Record initial position immediately
    await _recordCurrentPosition();
    
    // Start periodic tracking (every 1 minute)
    _trackingTimer = Timer.periodic(trackingInterval, (_) {
      _recordCurrentPosition();
    });
    
    return true;
  }
  
  /// Stop tracking and return results
  TripTrackingResult stopTracking() {
    debugPrint('[TripTracking] ========================================');
    debugPrint('[TripTracking] 🛑 Stopping tracking for trip: $_currentTripId');
    debugPrint('[TripTracking] Total points recorded: ${_gpsPoints.length}');
    debugPrint('[TripTracking] ========================================');
    
    _trackingTimer?.cancel();
    _trackingTimer = null;
    _isTracking = false;
    
    final result = TripTrackingResult(
      tripId: _currentTripId ?? '',
      gpsPoints: List.from(_gpsPoints),
      totalDistanceKm: calculateDistance(),
      durationMinutes: tripDuration.inMinutes,
    );
    
    debugPrint('[TripTracking] Final distance: ${result.totalDistanceKm.toStringAsFixed(2)} km');
    debugPrint('[TripTracking] Duration: ${result.durationMinutes} minutes');
    
    // Don't clear data yet - keep for end trip screen
    // Will be cleared on next startTracking
    
    return result;
  }
  
  /// Record current GPS position
  Future<void> _recordCurrentPosition() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
      
      final point = GpsPoint.fromPosition(position);
      _gpsPoints.add(point);
      
      debugPrint('[TripTracking] 📍 GPS point #${_gpsPoints.length}: ${point.lat}, ${point.lng}');
      
      // Calculate running distance
      final currentDistance = calculateDistance();
      debugPrint('[TripTracking] 📏 Running distance: ${currentDistance.toStringAsFixed(2)} km');
      
    } catch (e) {
      debugPrint('[TripTracking] ⚠️ Error recording position: $e');
    }
  }
  
  /// Calculate total distance from GPS points using Haversine formula
  double calculateDistance() {
    if (_gpsPoints.length < 2) return 0.0;
    
    double totalDistance = 0.0;
    
    for (int i = 0; i < _gpsPoints.length - 1; i++) {
      final p1 = _gpsPoints[i];
      final p2 = _gpsPoints[i + 1];
      totalDistance += _haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);
    }
    
    return totalDistance;
  }
  
  /// Haversine formula to calculate distance between two GPS coordinates
  /// Returns distance in kilometers
  double _haversineDistance(double lat1, double lng1, double lat2, double lng2) {
    const double earthRadiusKm = 6371.0;
    
    final double dLat = _toRadians(lat2 - lat1);
    final double dLng = _toRadians(lng2 - lng1);
    
    final double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_toRadians(lat1)) * cos(_toRadians(lat2)) *
        sin(dLng / 2) * sin(dLng / 2);
    
    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));
    
    return earthRadiusKm * c;
  }
  
  double _toRadians(double degrees) => degrees * pi / 180;
  
  /// Get GPS points as JSON for API
  List<Map<String, dynamic>> getGpsPointsJson() {
    return _gpsPoints.map((p) => p.toJson()).toList();
  }
  
  /// Clear all tracking data
  void clearData() {
    _gpsPoints.clear();
    _currentTripId = null;
    _startTime = null;
  }
}

/// Result from trip tracking
class TripTrackingResult {
  final String tripId;
  final List<GpsPoint> gpsPoints;
  final double totalDistanceKm;
  final int durationMinutes;
  
  TripTrackingResult({
    required this.tripId,
    required this.gpsPoints,
    required this.totalDistanceKm,
    required this.durationMinutes,
  });
  
  /// Get GPS points as JSON for API
  List<Map<String, dynamic>> get gpsPointsJson {
    return gpsPoints.map((p) => p.toJson()).toList();
  }
}
