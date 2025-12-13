import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../api_client.dart';
import '../models/trip_models.dart';
import '../services/trip_service.dart';

class StartTripScreen extends StatefulWidget {
  const StartTripScreen({
    super.key,
    required this.trip,
    required this.token,
    required this.tripService,
  });

  final TripModel trip;
  final String token;
  final TripService tripService;

  @override
  State<StartTripScreen> createState() => _StartTripScreenState();
}

class _StartTripScreenState extends State<StartTripScreen> {
  final _startOdoController = TextEditingController();
  final _otpController = TextEditingController();

  File? _odoImage;
  final ImagePicker _picker = ImagePicker();
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  bool _loading = false;
  double _startOdo = 0.0;

  // Check if this is actually a booking (not yet accepted/converted to trip)
  // Once accepted, bookings become trips with status "accepted", "non-started", etc.
  // IMPORTANT: When a booking is accepted, a trip is created with trip_id = booking_id
  // So the ID will still start with "booking-" but it's actually a trip now
  // We must check STATUS first, not just ID prefix
  bool get _isBooking {
    final status = widget.trip.status.toLowerCase();
    
    // If status indicates it's a trip (accepted, started, etc.), it's NOT a booking
    // Even if the ID starts with "booking-", once it has trip status, it's a trip
    if (status == 'accepted' || 
        status == 'non-started' || 
        status == 'not-started' ||
        status == 'started' || 
        status == 'completed' || 
        status == 'cancelled') {
      return false; // It's a trip, not a booking
    }
    
    // Only these statuses indicate it's still a booking
    // Check ID prefix as secondary check for safety
    return (status == 'booking confirmed' || 
            status == 'booking_confirmed' || 
            status == 'pending' ||
            status == 'new' ||
            status == 'offered') ||
           (widget.trip.id.startsWith('booking-') && 
            status != 'accepted' && 
            status != 'non-started' && 
            status != 'not-started');
  }

  @override
  void dispose() {
    _startOdoController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _takePhoto() async {
    final XFile? photo = await _picker.pickImage(source: ImageSource.camera);
    if (photo != null) {
      setState(() {
        _odoImage = File(photo.path);
      });
    }
  }

  void _showOdometerDialog() {
    final startOdoCtrl = TextEditingController(
      text: _startOdo > 0 ? _startOdo.toString() : '',
    );

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Start Odometer'),
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () => Navigator.pop(ctx),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: startOdoCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Start Odometer (KM)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.speed, color: Colors.green),
                hintText: 'Enter starting odometer reading',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () {
              final val = double.tryParse(startOdoCtrl.text);
              if (val == null || val < 0) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Invalid Start Odometer')),
                );
                return;
              }
              Navigator.pop(ctx, val);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
            child: const Text('Confirm'),
          ),
        ],
      ),
    ).then((result) {
      if (result != null && result is double) {
        setState(() {
          _startOdo = result;
          _startOdoController.text = _startOdo.toString();
        });
      }
    });
  }

  Future<void> _getOTP() async {
    if (_isBooking) {
      _showBookingBlocked();
      return;
    }
    setState(() => _loading = true);
    try {
      final res = await _api.sendTripOtp(
        token: widget.token,
        tripId: widget.trip.id,
        type: 'start',
      );

      if (res.success && res.body['data'] != null) {
        final otp = res.body['data']['otp']?.toString() ?? '';
        setState(() {
          _otpController.text = otp;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('OTP: $otp')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to get OTP: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submitAndStartTrip() async {
    // CRITICAL: Check if this is a booking - bookings cannot be started directly
    if (_isBooking) {
      _showBookingBlocked();
      return;
    }
    
    // Additional validation: Check if this is actually a booking (double-check)
    // Check STATUS first, not just ID prefix
    // When a booking is accepted, it becomes a trip with status "accepted"
    // Even though the ID may still start with "booking-", it's now a trip
    final status = widget.trip.status.toLowerCase();
    final isActuallyBooking = (status == 'booking confirmed' || 
                              status == 'booking_confirmed' || 
                              status == 'pending' ||
                              status == 'new' ||
                              status == 'offered') &&
                              status != 'accepted' &&
                              status != 'non-started' &&
                              status != 'not-started';
    
    if (isActuallyBooking) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cannot start a booking. Please accept the booking first to convert it to a trip.'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 4),
        ),
      );
      return;
    }
    
    // Validate OTP is required
    if (_otpController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter OTP (required)')),
      );
      return;
    }

    // Validate Start Odometer is required and > 0
    if (_startOdo <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter valid Start Odometer reading (required, must be > 0)')),
      );
      return;
    }

    setState(() => _loading = true);

    try {
      // Start Trip with odometer and OTP (both now required)
      // Note: This should only be called for trips, not bookings
      await widget.tripService.startTrip(
        token: widget.token,
        tripId: widget.trip.id,
        otp: _otpController.text,
        startOdometer: _startOdo,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Trip Started Successfully!')),
        );
        // Navigate back to trips list
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      if (mounted) {
        String errorMessage = e.toString().replaceAll('Exception: ', '');
        
        // Check if this is a booking ID error
        if (widget.trip.id.startsWith('booking-') || 
            errorMessage.toLowerCase().contains('cannot start a booking') ||
            errorMessage.toLowerCase().contains('booking must be accepted')) {
          errorMessage = 'Cannot start a booking. Please accept the booking first to convert it to a trip.';
        }
        // Extract error message from API response if available
        else if (errorMessage.contains('Failed to start trip') || errorMessage.contains('400')) {
          // Try to get more specific error from the exception
          if (errorMessage.contains('startOtp') || errorMessage.contains('OTP')) {
            errorMessage = 'Invalid or missing OTP. Please get a new OTP from backend.';
          } else if (errorMessage.contains('odometer') || errorMessage.contains('Odometer')) {
            errorMessage = 'Invalid odometer reading. Please enter a valid value greater than 0.';
          } else if (errorMessage.contains('status')) {
            errorMessage = 'Trip cannot be started. Please ensure the trip is accepted first.';
          } else if (errorMessage.contains('trip not found')) {
            errorMessage = 'Trip not found. The trip may have been cancelled or does not exist.';
          } else if (errorMessage.contains('Request failed')) {
            errorMessage = 'Unable to start trip. Please check your connection and try again.';
          }
        }
        
        _showErrorDialog(errorMessage);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showBookingBlocked() {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Start/OTP not available for admin bookings.'),
      ),
    );
  }

  void _showErrorDialog(String errorMessage) {
    // Extract a user-friendly message
    String friendlyMessage = errorMessage;
    
    // Remove "start trip: " prefix if present
    if (friendlyMessage.startsWith('start trip: ')) {
      friendlyMessage = friendlyMessage.substring('start trip: '.length);
    }
    
    // Map common error patterns to user-friendly messages
    if (errorMessage.contains('already assigned')) {
      friendlyMessage = 'You are already assigned to another active booking. Please complete or cancel that booking first.';
    } else if (errorMessage.contains('Cannot start a booking')) {
      friendlyMessage = 'Cannot start a booking. Please accept the booking first to convert it to a trip.';
    } else if (errorMessage.contains('Invalid start OTP') || 
               errorMessage.contains('Invalid or missing OTP') || 
               (errorMessage.contains('OTP') && (errorMessage.contains('invalid') || errorMessage.contains('incorrect')))) {
      friendlyMessage = 'Invalid or incorrect OTP. Please get a new OTP from backend and try again.';
    } else if (errorMessage.contains('odometer') || errorMessage.contains('Odometer') || errorMessage.contains('startOdometer') || 
               errorMessage.contains('must be a positive number')) {
      friendlyMessage = 'Invalid odometer reading. Please enter a valid value greater than 0.';
    } else if (errorMessage.contains('must be at least 4 characters')) {
      friendlyMessage = 'OTP must be at least 4 characters long. Please enter a valid OTP.';
    } else if (errorMessage.contains('status') && (errorMessage.contains('cannot') || errorMessage.contains('not allowed'))) {
      friendlyMessage = 'Trip cannot be started. Please ensure the trip is accepted first.';
    } else if (errorMessage.contains('not found') || errorMessage.contains('does not exist') || errorMessage.contains('Booking not found')) {
      friendlyMessage = 'Trip not found. The trip may have been cancelled or does not exist.';
    } else if (errorMessage.contains('Request failed') || errorMessage.contains('connection')) {
      friendlyMessage = 'Unable to start trip. Please check your connection and try again.';
    } else if (errorMessage.contains('Unable to start trip')) {
      // Already user-friendly, use as-is
      friendlyMessage = errorMessage;
    } else if (errorMessage.length > 150) {
      // If message is too long, provide a generic one
      friendlyMessage = 'Unable to start trip. Please verify your OTP and odometer reading, then try again.';
    }

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Unable to Start Trip',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            GestureDetector(
              onTap: () => Navigator.pop(ctx),
              child: Container(
                width: 28,
                height: 28,
                decoration: const BoxDecoration(
                  color: Colors.grey,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.close,
                  size: 16,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              friendlyMessage,
              style: const TextStyle(fontSize: 14, color: Colors.black87),
            ),
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('OK'),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Start Trip Details'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_isBooking)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        border: Border.all(color: Colors.orange.shade100),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'This request is an admin booking. OTP and start actions work only for trips. Please wait until it appears as a trip or contact support.',
                        style: TextStyle(color: Colors.orange.shade900, fontSize: 12),
                      ),
                    ),

                  // Odometer Photo Section
                  GestureDetector(
                    onTap: _takePhoto,
                    child: Container(
                      width: double.infinity,
                      height: 180,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: _odoImage != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.file(_odoImage!, fit: BoxFit.cover),
                            )
                          : Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.green.shade50,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(Icons.camera_alt,
                                      size: 32, color: Colors.green.shade700),
                                ),
                                const SizedBox(height: 12),
                                const Text(
                                  'Take Start ODO Meter Photo',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Tap to capture starting odometer reading\n(Optional)',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Colors.grey.shade600,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Start ODO Value (Required)
                  const Row(
                    children: [
                      Text(
                        'Start ODO meter Value',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      SizedBox(width: 8),
                      Text(
                        '*',
                        style: TextStyle(color: Colors.red, fontSize: 16),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: _showOdometerDialog,
                    child: AbsorbPointer(
                      child: TextField(
                        controller: _startOdoController,
                        decoration: const InputDecoration(
                          hintText: 'Enter starting odometer reading',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Customer OTP (Required)
                  const Row(
                    children: [
                      Text(
                        'Customer Start OTP',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      SizedBox(width: 8),
                      Text(
                        '*',
                        style: TextStyle(color: Colors.red, fontSize: 16),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    maxLength: 4,
                    decoration: const InputDecoration(
                      hintText: 'Enter 4-digit OTP',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton.icon(
                    icon: const Icon(Icons.key),
                    label: const Text('Get OTP from Backend'),
                    onPressed: _isBooking ? null : _getOTP,
                  ),
                  const SizedBox(height: 32),

                  // Submit Button
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _isBooking ? _showBookingBlocked : _submitAndStartTrip,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Start Trip',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Info
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.blue.shade100),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue.shade700),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Ensure the starting odometer reading is accurate. This will be used to calculate the trip distance.',
                            style: TextStyle(color: Colors.blue.shade900, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }
}
