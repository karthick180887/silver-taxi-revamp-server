import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:sendotp_flutter_sdk/sendotp_flutter_sdk.dart';
import '../api_client.dart';
import '../models/trip_models.dart';
import '../services/trip_service.dart';
import '../services/odometer_ocr_service.dart';

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
  final _ocrService = OdometerOcrService();
  bool _loading = false;
  bool _processingOcr = false;
  double _startOdo = 0.0;
  String? _reqId; // Store Request ID from Widget SDK

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
    final XFile? photo = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 85, // Good quality for OCR
    );
    if (photo != null) {
      final file = File(photo.path);
      setState(() {
        _odoImage = file;
        _processingOcr = true;
      });
      
      // Process with OCR
      final result = await _ocrService.extractOdometerReading(file);
      
      if (mounted) {
        setState(() => _processingOcr = false);
        
        if (result.success && result.value != null) {
          // Show confirmation dialog with detected value
          _showOcrResultDialog(result);
        } else {
          // Show error and let user enter manually
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.message),
              backgroundColor: Colors.orange,
              duration: const Duration(seconds: 4),
            ),
          );
        }
      }
    }
  }

  void _showOcrResultDialog(OcrResult result) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.document_scanner, color: Colors.green.shade700),
            const SizedBox(width: 8),
            const Text('Odometer Detected'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Column(
                children: [
                  const Icon(Icons.speed, size: 48, color: Colors.green),
                  const SizedBox(height: 12),
                  Text(
                    '${result.value!.toStringAsFixed(1)} km',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                  if (result.confidence > 0)
                    Text(
                      'Confidence: ${(result.confidence * 100).toStringAsFixed(0)}%',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Is this reading correct?',
              style: TextStyle(fontSize: 14),
            ),
            if (result.allDetectedNumbers != null && result.allDetectedNumbers!.length > 1)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'Other detected: ${result.allDetectedNumbers!.take(3).map((n) => n.toStringAsFixed(0)).join(", ")}',
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                ),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              // Let user enter manually
              _showOdometerDialog();
            },
            child: const Text('Enter Manually'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              setState(() {
                _startOdo = result.value!;
                _startOdoController.text = result.value!.toStringAsFixed(1);
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Odometer set to ${result.value!.toStringAsFixed(1)} km'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
            child: const Text('Use This Value'),
          ),
        ],
      ),
    );
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
    
    // NEW: Widget SDK Flow
    try {
      // 1. Get Customer Phone from Trip Data
      String? customerPhone = widget.trip.raw['phone']?.toString() ?? 
                             widget.trip.raw['customer']?['phone']?.toString();
      
      if (customerPhone == null || customerPhone.isEmpty) {
        throw Exception("Customer phone number not found in trip data");
      }
      
      // Clean phone number (remove +91 or 91 prefix for specific formats if needed, 
      // but Widget usually expects with country code if 'identifier' is used generically,
      // or specific format. Let's try to normalize to 91XXXXXXXXXX)
      customerPhone = customerPhone.replaceAll(RegExp(r'\D'), '');
      if (customerPhone.length == 10) {
        customerPhone = "91$customerPhone";
      }
      
      print('Sending OTP via Widget to: $customerPhone');

      // 2. Trigger Widget Send OTP
      final result = await OTPWidget.sendOTP({'identifier': customerPhone});
      
      if (result != null && result['type'] != 'error') {
        setState(() {
          _reqId = result['message']; // CORRECT: reqId is in 'message' field
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('OTP Sent Successfully to $customerPhone'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        throw Exception(result?['message'] ?? "Failed to send OTP via Widget");
      }
    } catch (e) {
      print('Widget Send OTP Error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send OTP: ${e.toString()}')),
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
    
    // Check if reqId is available (meaning Send OTP was called)
    if (_reqId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
         const SnackBar(content: Text('Please Send OTP first')),
      );
      return;
    }

    setState(() => _loading = true);

    try {
      // 1. Verify OTP via Widget SDK
      print('Verifying OTP: ${_otpController.text} with reqId: $_reqId');
      final result = await OTPWidget.verifyOTP({
        'reqId': _reqId, 
        'otp': _otpController.text
      });
      
      if (result != null && result['type'] == 'error') {
        throw Exception(result['message'] ?? "OTP Verification Failed");
      } else if (result == null) {
        throw Exception("Unknown verification error (null result)");
      }
      
      // 2. Get Access Token
      final String accessToken = result['message']; 

      String? odoImageUrl;
      if (_odoImage != null) {
        // Upload image first
        final uploadRes = await _api.uploadImage(
          token: widget.token,
          filePath: _odoImage!.path,
          type: 'trip', // or 'odometer' depending on backend enum, 'trip' sets context
        );
        
        if (uploadRes.success && uploadRes.body != null) {
           odoImageUrl = uploadRes.body['url'] ?? uploadRes.body['data']?['url'];
        } else {
           print('Failed to upload odometer image: ${uploadRes.message}');
        }
      }

      // Start Trip with odometer, OTP and AccessToken
      await widget.tripService.startTrip(
        token: widget.token,
        tripId: widget.trip.id,
        otp: _otpController.text,
        startOdometer: _startOdo,
        startOdometerImage: odoImageUrl,
        accessToken: accessToken, // Pass Widget Token
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Trip Started Successfully!')),
        );
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      print('Start Trip Error: $e');
      if (mounted) {
        String errorMessage = e.toString().replaceAll('Exception: ', '');
        
        // Handle common errors (abbreviated)
        if (errorMessage.contains('Invalid or expired Access Token')) {
          errorMessage = 'OTP Verification expired. Please retry.';
        } else if (errorMessage.contains('Phone number mismatch')) {
          errorMessage = 'Phone number verification failed.';
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

                  // Odometer Photo Section with OCR
                  GestureDetector(
                    onTap: _processingOcr ? null : _takePhoto,
                    child: Container(
                      width: double.infinity,
                      height: 180,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: _processingOcr
                          ? Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const CircularProgressIndicator(color: Colors.green),
                                const SizedBox(height: 16),
                                Text(
                                  'Reading odometer...',
                                  style: TextStyle(
                                    color: Colors.green.shade700,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Processing image with OCR',
                                  style: TextStyle(
                                    color: Colors.grey.shade500,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            )
                          : _odoImage != null
                              ? Stack(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(12),
                                      child: Image.file(_odoImage!, fit: BoxFit.cover, width: double.infinity, height: 180),
                                    ),
                                    Positioned(
                                      top: 8,
                                      right: 8,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: Colors.black54,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.camera_alt, color: Colors.white, size: 14),
                                            SizedBox(width: 4),
                                            Text('Tap to retake', style: TextStyle(color: Colors.white, fontSize: 11)),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
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
                                      child: Icon(Icons.document_scanner,
                                          size: 32, color: Colors.green.shade700),
                                    ),
                                    const SizedBox(height: 12),
                                    const Text(
                                      '📷 Scan Odometer',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Take a photo - OCR will auto-read the value',
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
                    maxLength: 6,
                    decoration: const InputDecoration(
                      hintText: 'Enter 6-digit OTP',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton.icon(
                    icon: const Icon(Icons.send),
                    label: const Text('Send OTP to Customer'),
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
