import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../design_system.dart';
import 'booking_flow_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.token});
  final String token;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final Completer<GoogleMapController> _controller = Completer();
  String? _customerName;

  // Default to a central location (e.g., city center) - This should eventually come from current location
  static const CameraPosition _kDefaultLocation = CameraPosition(
    target: LatLng(11.0168, 76.9558), // Coimbatore
    zoom: 14.4746,
  );

  @override
  void initState() {
    super.initState();
    _loadCustomerName();
  }

  Future<void> _loadCustomerName() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _customerName = prefs.getString('customer_name') ?? 'Rider';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // 1. Google Map Background
          GoogleMap(
            mapType: MapType.normal,
            initialCameraPosition: _kDefaultLocation,
            onMapCreated: (GoogleMapController controller) {
              _controller.complete(controller);
            },
            zoomControlsEnabled: false,
            myLocationButtonEnabled: false,
            myLocationEnabled: true,
          ),

          // 2. Gradient Overlay for Status Bar visibility
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 120,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.6),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // 3. Floating Header (Menu & Profile)
          Positioned(
            top: 50,
            left: 16,
            right: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Hamburger/Menu Button
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.menu, color: AppColors.textMain),
                    onPressed: () {
                      // Open Drawer or Side Menu
                      Scaffold.of(context).openDrawer();
                    },
                  ),
                ),

                // Greeting (Optional - center or hidden)
                // Text("Good Morning, $_customerName", style: AppTextStyles.h3.copyWith(color: Colors.white)),

                // Profile/Notifications
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.notifications_outlined, color: AppColors.textMain),
                    onPressed: () {
                      // Open Notifications
                    },
                  ),
                ),
              ],
            ),
          ),

          // 4. "Where to?" Bottom Sheet
          Positioned(
            left: 16,
            right: 16,
            bottom: 16, // Above bottom nav
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Main Search Box
                GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => BookingFlowScreen(token: widget.token),
                      ),
                    );
                  },
                  child: Container(
                    height: 56,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        const Icon(Icons.search, color: AppColors.textMain, size: 28),
                        const SizedBox(width: 16),
                        Text(
                          'Where to?',
                          style: AppTextStyles.h3.copyWith(fontSize: 20, color: AppColors.textSecondary),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.access_time_filled, size: 16, color: AppColors.textMain),
                              SizedBox(width: 4),
                              Text('Now', style: AppTextStyles.label),
                              Icon(Icons.keyboard_arrow_down, size: 16, color: AppColors.textMain),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Saved Places / Recent Horizontal Scroll
                SizedBox(
                  height: 100,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                       _buildLocationShortcut(
                        icon: Icons.home_filled,
                        label: "Home",
                        color: AppColors.primary,
                      ),
                      const SizedBox(width: 12),
                       _buildLocationShortcut(
                        icon: Icons.work,
                        label: "Work",
                        color: AppColors.warning,
                      ),
                      const SizedBox(width: 12),
                       _buildLocationShortcut(
                        icon: Icons.history,
                        label: "Gandhipuram",
                        color: AppColors.textSecondary,
                        isRecent: true,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Current Location FAB (Above Search)
          Positioned(
            right: 16,
            bottom: 200,
            child: FloatingActionButton(
              mini: true,
              backgroundColor: AppColors.surface,
              child: const Icon(Icons.my_location, color: AppColors.textMain),
              onPressed: () {
                // Determine position and animate camera
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationShortcut({
    required IconData icon,
    required String label,
    required Color color,
    bool isRecent = false,
  }) {
    return Container(
      width: 80,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isRecent ? AppColors.background : color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: isRecent ? AppColors.textSecondary : color, size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: AppTextStyles.bodySmall.copyWith(
              fontWeight: FontWeight.w500,
              color: AppColors.textMain,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
