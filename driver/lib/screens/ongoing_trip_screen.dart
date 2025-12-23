import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:flutter_polyline_points/flutter_polyline_points.dart';
import 'dart:async';
import '../models/trip_models.dart';
import '../services/trip_service.dart';
import '../services/trip_tracking_service.dart';
import 'end_trip_screen.dart';

const String kGoogleApiKey = "AIzaSyAYjrbg1hQJYC4vOMvQS7C9lJ3TDWQSuFo";

class OngoingTripScreen extends StatefulWidget {
  const OngoingTripScreen({
    super.key,
    required this.trip,
    required this.token,
    required this.tripService,
  });

  final TripModel trip;
  final String token;
  final TripService tripService;

  @override
  State<OngoingTripScreen> createState() => _OngoingTripScreenState();
}

class _OngoingTripScreenState extends State<OngoingTripScreen> {
  late TripModel _trip;
  bool _isLoading = false;
  bool _isOffRoute = false; // Simulation state
  
  // GPS Tracking
  final TripTrackingService _trackingService = TripTrackingService();
  Timer? _distanceUpdateTimer;
  double _liveDistance = 0.0;
  
  // Maps Implementation
  GoogleMapController? _mapController;
  final Set<Marker> _markers = {};
  final Set<Polyline> _polylines = {};
  LatLngBounds? _bounds;
  
  // Default fallback (Salem)
  static const CameraPosition _kDefaultLocation = CameraPosition(
    target: LatLng(11.6643, 78.1460),
    zoom: 14.4746,
  );

  @override
  void initState() {
    super.initState();
    _trip = widget.trip;
    _setupMapData();
    _refreshTripDetails();
    _startGpsTracking();
  }
  
  @override
  void dispose() {
    _distanceUpdateTimer?.cancel();
    super.dispose();
  }
  
  /// Start GPS tracking for this trip
  Future<void> _startGpsTracking() async {
    debugPrint('[OngoingTrip] Starting GPS tracking for trip: ${widget.trip.id}');
    final success = await _trackingService.startTracking(widget.trip.id);
    if (success) {
      debugPrint('[OngoingTrip] GPS tracking started successfully');
      // Update distance display every 30 seconds
      _distanceUpdateTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        if (mounted) {
          setState(() {
            _liveDistance = _trackingService.calculateDistance();
          });
        }
      });
    } else {
      debugPrint('[OngoingTrip] Failed to start GPS tracking');
    }
  }
  
  Future<void> _setupMapData() async {
    _markers.clear();
    _polylines.clear();
    
    // Parse coordinates or fallback
    final pickupLat = _trip.pickup.lat ?? 11.6643;
    final pickupLng = _trip.pickup.lng ?? 78.1460;
    
    final dropLat = _trip.drop.lat ?? 11.6643 + 0.05; // Fallback offset
    final dropLng = _trip.drop.lng ?? 78.1460 + 0.05;
    
    final pickupPos = LatLng(pickupLat, pickupLng);
    final dropPos = LatLng(dropLat, dropLng);
    
    setState(() {
      _markers.add(
        Marker(
          markerId: const MarkerId('pickup'),
          position: pickupPos,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
          infoWindow: InfoWindow(title: 'Pickup', snippet: _trip.pickup.address),
        ),
      );
      
      _markers.add(
        Marker(
          markerId: const MarkerId('drop'),
          position: dropPos,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
          infoWindow: InfoWindow(title: 'Drop', snippet: _trip.drop.address),
        ),
      );
      _bounds = _calculateBounds([pickupPos, dropPos]);
    });

    // Fetch Route Polyline
    try {
      PolylinePoints polylinePoints = PolylinePoints();
      PolylineResult result = await polylinePoints.getRouteBetweenCoordinates(
        googleApiKey: kGoogleApiKey,
        request: PolylineRequest(
          origin: PointLatLng(pickupPos.latitude, pickupPos.longitude),
          destination: PointLatLng(dropPos.latitude, dropPos.longitude),
          mode: TravelMode.driving,
        ),
      );

      if (result.points.isNotEmpty) {
        List<LatLng> polylineCoordinates = [];
        for (var point in result.points) {
          polylineCoordinates.add(LatLng(point.latitude, point.longitude));
        }
        
        if (mounted) {
          setState(() {
            _polylines.add(
              Polyline(
                polylineId: const PolylineId('route'),
                points: polylineCoordinates,
                color: _isOffRoute ? Colors.red : const Color(0xFF2563EB),
                width: 5,
              ),
            );
          });
        }
      } else {
        // Fallback to straight line
        if (mounted) {
          setState(() {
             _polylines.add(
              Polyline(
                polylineId: const PolylineId('route_direct'),
                points: [pickupPos, dropPos],
                color: _isOffRoute ? Colors.red : const Color(0xFF2563EB),
                width: 5,
                patterns: [PatternItem.dash(10), PatternItem.gap(10)], // Dashed for direct line
              ),
            );
          });
        }
      }
    } catch (e) {
      print("Error fetching polyline: $e");
    }
  }
  
  LatLngBounds _calculateBounds(List<LatLng> points) {
    double minLat = points.first.latitude;
    double maxLat = points.first.latitude;
    double minLng = points.first.longitude;
    double maxLng = points.first.longitude;
    
    for (var point in points) {
      if (point.latitude < minLat) minLat = point.latitude;
      if (point.latitude > maxLat) maxLat = point.latitude;
      if (point.longitude < minLng) minLng = point.longitude;
      if (point.longitude > maxLng) maxLng = point.longitude;
    }
    
    return LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );
  }

  Future<void> _refreshTripDetails() async {
    setState(() => _isLoading = true);
    try {
      final updatedTrip = await widget.tripService.getTripDetails(
        token: widget.token, 
        tripId: widget.trip.id,
      );
      
      if (updatedTrip != null) {
        if (mounted) {
          setState(() {
            _trip = updatedTrip;
          });
          _setupMapData(); // Refresh map data with new coordinates if any
        }
      }
    } catch (e) {
      print('Error refreshing trip details: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _toggleDeviation() {
    setState(() {
      _isOffRoute = !_isOffRoute;
      // Update polyline color
      _setupMapData(); 
    });
    
    if (_isOffRoute) {
      // Play sound or vibrate here in real app
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Simulated: Driver went off-route!'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }
  
  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    if (_bounds != null) {
      Future.delayed(const Duration(milliseconds: 500), () {
        controller.animateCamera(CameraUpdate.newLatLngBounds(_bounds!, 50));
      });
    }
  }

  Widget _buildMap() {
    return Stack(
      children: [
        GoogleMap(
          initialCameraPosition: _kDefaultLocation,
          onMapCreated: _onMapCreated,
          markers: _markers,
          polylines: _polylines,
          myLocationEnabled: true,
          myLocationButtonEnabled: false,
          zoomControlsEnabled: false,
          mapToolbarEnabled: false,
        ),
        
        // STRICT WARNING OVERLAY
        if (_isOffRoute)
          Positioned(
            top: 40,
            left: 24,
            right: 24,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFDC2626), // Strong Red
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.warning_amber_rounded, 
                      color: Color(0xFFDC2626),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'OFF ROUTE WARNING',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            letterSpacing: 1.0,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Please return to the assigned route immediately.',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final Uri launchUri = Uri(
      scheme: 'tel',
      path: phoneNumber,
    );
    if (await canLaunchUrl(launchUri)) {
      await launchUrl(launchUri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        forceMaterialTransparency: true,
        backgroundColor: Colors.transparent,
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
          child: CircleAvatar(
            backgroundColor: Colors.white,
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.black),
              onPressed: () => Navigator.of(context).pop(),
            ),
          ),
        ),
        actions: [
          // SIMULATION TOGGLE BUTTON
          Padding(
             padding: const EdgeInsets.only(right: 8.0),
             child: CircleAvatar(
               backgroundColor: const Color(0xFFFEF2F2),
               child: IconButton(
                  icon: Icon(Icons.alt_route, color: _isOffRoute ? Colors.red : Colors.grey),
                  tooltip: 'Simulate Off-Route',
                  onPressed: _toggleDeviation,
               ),
             ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Chip(
              label: const Text('ON TRIP', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              backgroundColor: const Color(0xFF10B981), // Emerald
              labelStyle: const TextStyle(color: Colors.white),
              side: BorderSide.none,
              shape: const StadiumBorder(),
            ),
          )
        ],
      ),
      body: Stack(
        children: [
          // 1. Map Layer
          Positioned.fill(
             bottom: MediaQuery.of(context).size.height * 0.4, // Map takes top 60%
             child: _buildMap(),
          ),

          // 2. Bottom Sheet for Details
          DraggableScrollableSheet(
            initialChildSize: 0.45,
            minChildSize: 0.45,
            maxChildSize: 0.8,
            builder: (context, scrollController) {
              return Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, -5),
                    ),
                  ],
                ),
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(24),
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 24),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),

                    // Customer Card
                    _buildCustomerCard(),

                    const SizedBox(height: 24),
                    const Divider(),
                    const SizedBox(height: 24),

                    // Route Timeline
                    _buildRouteTimeline(),

                    const SizedBox(height: 32),

                    // End Trip Action
                    _buildEndTripButton(),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCustomerCard() {
    return Row(
      children: [
        CircleAvatar(
          radius: 28,
          backgroundColor: const Color(0xFFEFF6FF), // Blue 50
          child: Text(
            _trip.customerName.isNotEmpty 
                ? _trip.customerName[0].toUpperCase() 
                : 'C',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2563EB),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _trip.customerName,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.star_rounded, size: 16, color: Color(0xFFF59E0B)),
                  const SizedBox(width: 4),
                  Text(
                    '4.8', // Placeholder rating
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF10B981).withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: IconButton(
             icon: const Icon(CupertinoIcons.phone_fill, color: Color(0xFF10B981)),
             onPressed: () => _makePhoneCall(_trip.raw['phone']?.toString() ?? 
                                             _trip.raw['customerPhone']?.toString() ?? 
                                             _trip.raw['customer']?['phone']?.toString() ?? ''),
           ),
        ),
      ],
    );
  }

  Widget _buildRouteTimeline() {
    return Column(
      children: [
        _buildLocationItem(
          icon: Icons.my_location,
          color: const Color(0xFF2563EB), // Blue
          isLast: false,
          label: 'PICKUP',
          address: _trip.pickup.address,
        ),
        _buildLocationItem(
          icon: Icons.location_on,
          color: const Color(0xFFEF4444), // Red
          isLast: true,
          label: 'DROP-OFF',
          address: _trip.drop.address,
        ),
      ],
    );
  }

  Widget _buildLocationItem({
    required IconData icon,
    required Color color,
    required bool isLast,
    required String label,
    required String address,
  }) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Icon(icon, color: color, size: 20),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    color: Colors.grey.shade200,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                      color: Colors.grey.shade500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    address,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF334155),
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEndTripButton() {
    return Column(
      children: [
        // Live distance tracker
        if (_trackingService.isTracking)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF22C55E).withOpacity(0.3)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.gps_fixed, color: Color(0xFF22C55E), size: 18),
                const SizedBox(width: 8),
                Text(
                  'GPS Tracking: ${_liveDistance.toStringAsFixed(1)} km traveled',
                  style: const TextStyle(
                    color: Color(0xFF166534),
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: () {
              // Stop tracking and get results
              final trackingResult = _trackingService.stopTracking();
              debugPrint('[OngoingTrip] GPS tracking stopped. Distance: ${trackingResult.totalDistanceKm} km');
              
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => EndTripScreen(
                    trip: _trip,
                    token: widget.token,
                    tripService: widget.tripService,
                    trackingResult: trackingResult, // Pass GPS data
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.stop_circle_outlined),
                SizedBox(width: 8),
                Text(
                  'End Trip',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
