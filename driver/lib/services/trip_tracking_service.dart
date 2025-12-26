import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api_client.dart';

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
  String? _authToken; // Store token for server sync
  StreamSubscription<Position>? _positionStreamSubscription;
  final List<GpsPoint> _gpsPoints = [];
  bool _isTracking = false;
  DateTime? _startTime;
  int _syncCounter = 0; // Counter for server sync (sync every 5 points)
  
  // Configuration
  static const int distanceFilterMeters = 10;
  static const int _serverSyncInterval = 5; // Sync to server every N GPS points
  
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
  Future<bool> startTracking(String tripId, String token) async {
    if (_isTracking) {
      debugPrint('[TripTracking] Already tracking trip: $_currentTripId');
      return false;
    }

    // 1. Try to restore from server first (most reliable across app kills)
    if (_currentTripId == null) {
      await _restoreFromServer(tripId, token);
      if (_currentTripId == tripId && _gpsPoints.isNotEmpty) {
        debugPrint('[TripTracking] Restored ${_gpsPoints.length} points from server for trip: $tripId');
        _isTracking = true;
        _authToken = token;
        _startLocationStream(token);
        return true;
      }
    }
    
    // 2. Fallback: Try to restore from local SharedPreferences
    if (_currentTripId == null) {
      await _restoreState();
      if (_currentTripId == tripId) {
        debugPrint('[TripTracking] Resuming tracking from local storage for trip: $tripId');
        _isTracking = true;
        _authToken = token;
        _startLocationStream(token);
        return true;
      }
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
    _authToken = token;
    _gpsPoints.clear();
    _startTime = DateTime.now();
    _isTracking = true;
    _syncCounter = 0;
    
    // Save initial state
    await _saveState();
    
    debugPrint('[TripTracking] ========================================');
    debugPrint('[TripTracking] 🚗 Started tracking for trip: $tripId');
    debugPrint('[TripTracking] ========================================');
    
    _startLocationStream(token);
    
    return true;
  }

  void _startLocationStream(String token) async {
    // Configure location settings for 10m updates
    final locationSettings = AndroidSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: distanceFilterMeters,
      forceLocationManager: true,
      intervalDuration: const Duration(seconds: 5),
      // Background Notification Setup
      foregroundNotificationConfig: const ForegroundNotificationConfig(
        notificationTitle: "Trip in Progress",
        notificationText: "Tracking location in background",
        notificationIcon: AndroidResource(name: 'ic_launcher', defType: 'mipmap'),
        enableWakeLock: true,
      ),
    );

    // Record initial position immediately if empty
    if (_gpsPoints.isEmpty) {
      try {
        final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
        _recordPosition(position, token);
      } catch (e) {
        debugPrint('[TripTracking] Error getting initial position: $e');
      }
    }
    
    // Start position stream
    _positionStreamSubscription = Geolocator.getPositionStream(locationSettings: locationSettings)
        .listen((Position position) {
           _recordPosition(position, token);
        }, onError: (e) {
           debugPrint('[TripTracking] Location stream error: $e');
        });
  }
  
  /// Stop tracking and return results
  TripTrackingResult stopTracking() {
    debugPrint('[TripTracking] ========================================');
    debugPrint('[TripTracking] 🛑 Stopping tracking for trip: $_currentTripId');
    debugPrint('[TripTracking] Total points recorded: ${_gpsPoints.length}');
    debugPrint('[TripTracking] ========================================');
    
    _positionStreamSubscription?.cancel();
    _positionStreamSubscription = null;
    _isTracking = false;
    
    // Clear persisted state
    _clearState();
    
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
  
  /// Record position update
  Future<void> _recordPosition(Position position, String token) async {
    try {
      final point = GpsPoint.fromPosition(position);
      _gpsPoints.add(point);
      
      // Persist new state locally
      _saveState();
      
      // Sync to server every N GPS points to ensure persistence across app kills
      _syncCounter++;
      if (_syncCounter >= _serverSyncInterval) {
        _syncCounter = 0;
        await _syncToServer(token);
      }
      
      debugPrint('[TripTracking] 📍 GPS point #${_gpsPoints.length}: ${point.lat}, ${point.lng}');
      
      // Calculate running distance
      final currentDistance = calculateDistance();
      debugPrint('[TripTracking] 📏 Running distance: ${currentDistance.toStringAsFixed(2)} km');

      // Update server with current location
      try {
        debugPrint('[TripTracking] 📡 Updating server location (Distance: ${currentDistance.toStringAsFixed(3)} km)...');
        
        final res = await DriverApiClient().updateLocation(
          token: token,
          latitude: point.lat,
          longitude: point.lng,
        );
        
        if (res.success) {
           debugPrint('[TripTracking] ✅ Server location updated successfully');
        } else {
           debugPrint('[TripTracking] ⚠️ Failed to update server location: ${res.message}');
        }
         
      } catch (e) {
        debugPrint('[TripTracking] ⚠️ Error updating server location: $e');
      }
      
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
    _authToken = null;
    _startTime = null;
    _syncCounter = 0;
    _clearState();
  }

  // --- Server Sync Helpers ---

  /// Sync GPS points to server for persistence
  Future<void> _syncToServer(String token) async {
    if (_currentTripId == null || _gpsPoints.isEmpty) return;
    
    try {
      debugPrint('[TripTracking] 🔄 Syncing ${_gpsPoints.length} GPS points to server...');
      
      final result = await DriverApiClient().saveGpsPoints(
        token: token,
        tripId: _currentTripId!,
        gpsPoints: getGpsPointsJson(),
        gpsDistance: calculateDistance(),
      );
      
      if (result.success) {
        debugPrint('[TripTracking] ✅ GPS points synced to server successfully');
      } else {
        debugPrint('[TripTracking] ⚠️ Failed to sync GPS points: ${result.message}');
      }
    } catch (e) {
      debugPrint('[TripTracking] ⚠️ Error syncing GPS points to server: $e');
    }
  }

  /// Restore GPS points from server (most reliable across app kills)
  Future<void> _restoreFromServer(String tripId, String token) async {
    try {
      debugPrint('[TripTracking] 📥 Attempting to restore GPS points from server for trip: $tripId');
      
      final result = await DriverApiClient().getGpsPoints(
        token: token,
        tripId: tripId,
      );
      
      if (result.success && result.body['data'] != null) {
        final data = result.body['data'];
        final List<dynamic> serverPoints = data['gpsPoints'] ?? [];
        
        if (serverPoints.isNotEmpty) {
          _currentTripId = tripId;
          _gpsPoints.clear();
          
          for (var p in serverPoints) {
            _gpsPoints.add(GpsPoint(
              lat: (p['lat'] as num).toDouble(),
              lng: (p['lng'] as num).toDouble(),
              timestamp: DateTime.parse(p['timestamp']),
            ));
          }
          
          debugPrint('[TripTracking] ✅ Restored ${_gpsPoints.length} GPS points from server');
        }
      }
    } catch (e) {
      debugPrint('[TripTracking] ⚠️ Error restoring GPS points from server: $e');
    }
  }

  // --- Persistence Helpers ---

  static const String _kPrefTripId = 'tracking_trip_id';
  static const String _kPrefPoints = 'tracking_points';
  static const String _kPrefStartTime = 'tracking_start_time';

  Future<void> _saveState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_currentTripId != null) {
        await prefs.setString(_kPrefTripId, _currentTripId!);
      }
      if (_startTime != null) {
        await prefs.setString(_kPrefStartTime, _startTime!.toIso8601String());
      }
      
      // Serialize points
      final pointsJson = jsonEncode(_gpsPoints.map((p) => p.toJson()).toList());
      await prefs.setString(_kPrefPoints, pointsJson);
      
    } catch (e) {
      debugPrint('[TripTracking] Error saving state: $e');
    }
  }

  Future<void> _restoreState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedTripId = prefs.getString(_kPrefTripId);
      
      if (savedTripId != null) {
        _currentTripId = savedTripId;
        
        final startTimeStr = prefs.getString(_kPrefStartTime);
        if (startTimeStr != null) {
          _startTime = DateTime.parse(startTimeStr);
        }

        final pointsStr = prefs.getString(_kPrefPoints);
        if (pointsStr != null) {
          final List<dynamic> pointsList = jsonDecode(pointsStr);
          _gpsPoints.clear();
          for (var p in pointsList) {
             _gpsPoints.add(GpsPoint(
               lat: p['lat'],
               lng: p['lng'],
               timestamp: DateTime.parse(p['timestamp']),
             ));
          }
        }
        
        debugPrint('[TripTracking] Restored state: Trip $_currentTripId with ${_gpsPoints.length} points');
      }
    } catch (e) {
      debugPrint('[TripTracking] Error restoring state: $e');
    }
  }

  Future<void> _clearState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_kPrefTripId);
      await prefs.remove(_kPrefPoints);
      await prefs.remove(_kPrefStartTime);
    } catch (e) {
      debugPrint('[TripTracking] Error clearing state: $e');
    }
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
