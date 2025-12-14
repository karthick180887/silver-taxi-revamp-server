import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/trip_models.dart';
import '../services/trip_service.dart';
import 'end_trip_screen.dart';

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
  // Use a simulated map view since google_maps_flutter is not added
  Widget _buildMapPlaceholder() {
    return Container(
      color: const Color(0xFFE5E7EB),
      child: Stack(
        children: [
          Center(
            child: Icon(
              CupertinoIcons.map_fill,
              size: 64,
              color: Colors.grey.shade400,
            ),
          ),
          // Simulated Route Line
          CustomPaint(
            painter: MockRoutePainter(),
            size: Size.infinite,
          ),
        ],
      ),
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
             child: _buildMapPlaceholder(),
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
            widget.trip.customer.name.isNotEmpty 
                ? widget.trip.customer.name[0].toUpperCase() 
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
                widget.trip.customer.name,
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
             onPressed: () => _makePhoneCall(widget.trip.customer.phone),
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
          address: widget.trip.pickup.address,
        ),
        _buildLocationItem(
          icon: Icons.location_on,
          color: const Color(0xFFEF4444), // Red
          isLast: true,
          label: 'DROP-OFF',
          address: widget.trip.drop.address,
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
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: () {
           Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => EndTripScreen(
                trip: widget.trip,
                token: widget.token,
                tripService: widget.tripService,
              ),
            ),
          );
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFEF4444), // Red
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
    );
  }
}

class MockRoutePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF6366F1).withOpacity(0.3)
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke;

    final path = Path();
    path.moveTo(size.width * 0.2, size.height * 0.8);
    path.quadraticBezierTo(
      size.width * 0.5,
      size.height * 0.5,
      size.width * 0.8,
      size.height * 0.2,
    );

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
