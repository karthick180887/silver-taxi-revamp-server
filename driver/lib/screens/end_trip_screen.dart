import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../api_client.dart';
import '../models/trip_models.dart';
import '../services/trip_service.dart';
import '../services/trip_tracking_service.dart';
import '../services/odometer_ocr_service.dart';
import 'package:sendotp_flutter_sdk/sendotp_flutter_sdk.dart';

class EndTripScreen extends StatefulWidget {
  const EndTripScreen({
    super.key,
    required this.trip,
    required this.token,
    required this.tripService,
    this.trackingResult, // GPS tracking data from OngoingTripScreen
  });

  final TripModel trip;
  final String token;
  final TripService tripService;
  final TripTrackingResult? trackingResult;

  @override
  State<EndTripScreen> createState() => _EndTripScreenState();
}

class _EndTripScreenState extends State<EndTripScreen> {
  final _endOdoController = TextEditingController();
  final _endOtpController = TextEditingController();
  final _petChargeController = TextEditingController(text: '0');
  final _permitChargeController = TextEditingController(text: '0');
  final _parkingChargeController = TextEditingController(text: '0');
  final _waitingChargeController = TextEditingController(text: '0');
  final _hillChargeController = TextEditingController(text: '0');
  final _tollChargeController = TextEditingController(text: '0');

  File? _odoImage;
  final ImagePicker _picker = ImagePicker();
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  final _ocrService = OdometerOcrService();
  bool _loading = false;
  bool _processingOcr = false;

  // Odometer values
  double _startOdo = 0.0;
  double _endOdo = 0.0;
  double _totalDistance = 0.0;
  
  // GPS tracking info
  double? _gpsDistance;
  int? _gpsDuration;
  int _gpsPointCount = 0;
  
  // Distance comparison
  static const double _distanceTolerance = 0.05; // 5% tolerance
  String _distanceSource = 'matched'; // 'matched', 'gps', 'odometer'
  double _distanceMismatchPercent = 0.0;
  bool _showMismatchWarning = false;

  @override
  void initState() {
    super.initState();
    // Initialize from trip data if available
    _startOdo = widget.trip.startOdometer ?? 0.0;
    
    // Initialize GPS data from tracking result if available
    if (widget.trackingResult != null) {
      _gpsDistance = widget.trackingResult!.totalDistanceKm;
      _gpsDuration = widget.trackingResult!.durationMinutes;
      _gpsPointCount = widget.trackingResult!.gpsPoints.length;
      
      // Pre-fill distance with GPS-calculated value
      _totalDistance = _gpsDistance!;
      
      debugPrint('[EndTripScreen] GPS data received:');
      debugPrint('[EndTripScreen] - Distance: $_gpsDistance km');
      debugPrint('[EndTripScreen] - Duration: $_gpsDuration min');
      debugPrint('[EndTripScreen] - Points: $_gpsPointCount');
    }
  }

  @override
  void dispose() {
    _endOdoController.dispose();
    _endOtpController.dispose();
    _petChargeController.dispose();
    _permitChargeController.dispose();
    _parkingChargeController.dispose();
    _waitingChargeController.dispose();
    _hillChargeController.dispose();
    _tollChargeController.dispose();
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
          // Validate that end odometer is greater than start odometer
          if (result.value! < _startOdo) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Detected ${result.value!.toStringAsFixed(1)} km is less than start odometer $_startOdo km. Please retake or enter manually.'),
                backgroundColor: Colors.orange,
                duration: const Duration(seconds: 4),
              ),
            );
          } else {
            // Show confirmation dialog with detected value
            _showOcrResultDialog(result);
          }
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
    final distance = result.value! - _startOdo;
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.document_scanner, color: Colors.blue.shade700),
            const SizedBox(width: 8),
            const Text('End Odometer Detected'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Column(
                children: [
                  const Icon(Icons.speed, size: 48, color: Colors.blue),
                  const SizedBox(height: 12),
                  Text(
                    '${result.value!.toStringAsFixed(1)} km',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.green.shade100,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'Distance: ${distance.toStringAsFixed(1)} km',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.green.shade800,
                      ),
                    ),
                  ),
                  if (result.confidence > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        'Confidence: ${(result.confidence * 100).toStringAsFixed(0)}%',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
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
                _endOdo = result.value!;
                _totalDistance = (_endOdo - _startOdo).clamp(0.0, double.infinity);
                _endOdoController.text = result.value!.toStringAsFixed(1);
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('End odometer set to ${result.value!.toStringAsFixed(1)} km (${distance.toStringAsFixed(1)} km traveled)'),
                  backgroundColor: Colors.blue,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
            ),
            child: const Text('Use This Value'),
          ),
        ],
      ),
    );
  }

  void _showOdometerDialog() {
    // Pre-fill end odo if already entered
    final endOdoCtrl = TextEditingController(text: _endOdo > 0 ? _endOdo.toString() : '');
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) {
          // Calculate distance whenever end odo changes
          double currentEnd = double.tryParse(endOdoCtrl.text) ?? 0.0;
          double dist = (currentEnd - _startOdo).clamp(0.0, double.infinity);

          return AlertDialog(
            title: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Odometer Reading'),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    enabled: false,
                    controller: TextEditingController(text: _startOdo.toString()),
                    decoration: const InputDecoration(
                      labelText: 'Start Odometer (KM)',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.speed),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: endOdoCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'End Odometer (KM)',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.speed, color: Colors.green),
                    ),
                    onChanged: (val) {
                      setState(() {});
                    },
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.blue.shade100),
                    ),
                    child: Column(
                      children: [
                        const Text(
                          'Total Distance',
                          style: TextStyle(color: Colors.grey),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${dist.toStringAsFixed(1)} KM',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
              ),
              ElevatedButton(
                onPressed: () {
                  final val = double.tryParse(endOdoCtrl.text);
                  if (val == null || val < _startOdo) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Invalid End Odometer')),
                    );
                    return;
                  }
                  Navigator.pop(ctx, val);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Confirm'),
              ),
            ],
          );
        },
      ),
    ).then((result) {
      if (result != null && result is double) {
        setState(() {
          _endOdo = result;
          _totalDistance = (_endOdo - _startOdo).clamp(0.0, double.infinity);
          _endOdoController.text = _endOdo.toString();
          // Compare GPS and Odometer distances after setting odometer
          _compareDistances();
        });
      }
    });
  }

  /// Compare GPS distance with Odometer distance and determine which to use
  void _compareDistances() {
    final odometerDistance = (_endOdo - _startOdo).clamp(0.0, double.infinity);
    final gpsDistance = _gpsDistance ?? 0.0;
    
    // If we don't have GPS data, use odometer
    if (gpsDistance <= 0 || _gpsPointCount < 2) {
      _distanceSource = 'odometer';
      _showMismatchWarning = false;
      _totalDistance = odometerDistance;
      debugPrint('[DistanceVerify] No valid GPS data, using odometer: $odometerDistance km');
      return;
    }
    
    // Calculate percentage difference
    final avgDistance = (odometerDistance + gpsDistance) / 2;
    if (avgDistance > 0) {
      _distanceMismatchPercent = ((odometerDistance - gpsDistance).abs() / avgDistance) * 100;
    }
    
    debugPrint('[DistanceVerify] ========================================');
    debugPrint('[DistanceVerify] GPS Distance: ${gpsDistance.toStringAsFixed(2)} km');
    debugPrint('[DistanceVerify] Odometer Distance: ${odometerDistance.toStringAsFixed(2)} km');
    debugPrint('[DistanceVerify] Difference: ${_distanceMismatchPercent.toStringAsFixed(1)}%');
    
    // Check if within tolerance
    if (_distanceMismatchPercent <= (_distanceTolerance * 100)) {
      // Within tolerance - distances match
      _distanceSource = 'matched';
      _showMismatchWarning = false;
      // Use GPS distance as it's typically more accurate for billing
      _totalDistance = gpsDistance;
      debugPrint('[DistanceVerify] ✅ Distances match within tolerance - using GPS');
    } else {
      // Mismatch detected - prioritize odometer (physical evidence)
      _distanceSource = 'odometer';
      _showMismatchWarning = true;
      _totalDistance = odometerDistance;
      debugPrint('[DistanceVerify] ⚠️ MISMATCH - prioritizing odometer reading');
    }
    debugPrint('[DistanceVerify] Final distance: ${_totalDistance.toStringAsFixed(2)} km');
    debugPrint('[DistanceVerify] ========================================');
  }

  /// Show distance mismatch warning dialog
  Future<bool> _showDistanceMismatchWarning() async {
    final odometerDistance = (_endOdo - _startOdo).clamp(0.0, double.infinity);
    final gpsDistance = _gpsDistance ?? 0.0;
    
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.orange[700], size: 28),
            const SizedBox(width: 8),
            const Text('Distance Mismatch'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'GPS tracking and Odometer readings show different distances:',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 16),
            _buildDistanceCompareRow('📍 GPS Distance', '${gpsDistance.toStringAsFixed(1)} km'),
            const SizedBox(height: 8),
            _buildDistanceCompareRow('🔢 Odometer Distance', '${odometerDistance.toStringAsFixed(1)} km'),
            const SizedBox(height: 8),
            _buildDistanceCompareRow('📊 Difference', '${_distanceMismatchPercent.toStringAsFixed(1)}%',
                color: Colors.orange[700]),
            const Divider(height: 24),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.blue[700], size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Using Odometer reading (${odometerDistance.toStringAsFixed(1)} km) for fare calculation as physical evidence.',
                      style: TextStyle(fontSize: 12, color: Colors.blue[800]),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange[700],
              foregroundColor: Colors.white,
            ),
            child: const Text('Proceed with Odometer'),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  Widget _buildDistanceCompareRow(String label, String value, {Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 14)),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  void _showFareBreakdown(double totalFare, double baseFare, double vehicleFare, double extraCharges, double convenienceFee) {
    // Parse individual charges for display
    final hillCharge = double.tryParse(_hillChargeController.text) ?? 0.0;
    final tollCharge = double.tryParse(_tollChargeController.text) ?? 0.0;
    final petCharge = double.tryParse(_petChargeController.text) ?? 0.0;
    final permitCharge = double.tryParse(_permitChargeController.text) ?? 0.0;
    final parkingCharge = double.tryParse(_parkingChargeController.text) ?? 0.0;
    final waitingCharge = double.tryParse(_waitingChargeController.text) ?? 0.0;
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Fare Breakdown'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildFareRow('Distance', '${_totalDistance.toStringAsFixed(1)} KM', null),
              const Divider(),
              _buildFareRow('Base Rate × Distance', '₹${baseFare.toStringAsFixed(2)}', null),
              _buildFareRow('Vehicle Base Rate', '₹${vehicleFare.toStringAsFixed(2)}', null),
              // Individual extra charges
              if (hillCharge > 0) _buildFareRow('Hill Charge', '₹${hillCharge.toStringAsFixed(2)}', null),
              if (tollCharge > 0) _buildFareRow('Toll Charge', '₹${tollCharge.toStringAsFixed(2)}', null),
              if (petCharge > 0) _buildFareRow('Pet Charge', '₹${petCharge.toStringAsFixed(2)}', null),
              if (permitCharge > 0) _buildFareRow('Permit Charge', '₹${permitCharge.toStringAsFixed(2)}', null),
              if (parkingCharge > 0) _buildFareRow('Parking Charge', '₹${parkingCharge.toStringAsFixed(2)}', null),
              if (waitingCharge > 0) _buildFareRow('Waiting Charge', '₹${waitingCharge.toStringAsFixed(2)}', null),
              const Divider(),
              // Convenience Fee only (NO TAX)
              _buildFareRow('Convenience Fee', '₹${convenienceFee.toStringAsFixed(2)}', null),
              const Divider(thickness: 2),
              _buildFareRow('Total Fare', '₹${totalFare.toStringAsFixed(2)}', FontWeight.bold),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _submitAndEndTripConfirmed(totalFare);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Confirm & Submit'),
          ),
        ],
      ),
    );
  }

  Widget _buildFareRow(String label, String value, FontWeight? fontWeight) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: fontWeight)),
          Text(value, style: TextStyle(fontWeight: fontWeight ?? FontWeight.w500)),
        ],
      ),
    );
  }

  Future<void> _submitAndEndTrip() async {
    // Validate End OTP is required - show prominent error if missing
    if (_endOtpController.text.trim().isEmpty) {
      _showEndOtpRequiredDialog();
      return;
    }

    // Validate End Odometer is required
    if (_endOdo <= _startOdo) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter valid End Odometer reading (required, must be > start odometer)'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }

    // Show distance mismatch warning if detected
    if (_showMismatchWarning) {
      final proceed = await _showDistanceMismatchWarning();
      if (!proceed) {
        return; // User cancelled - don't proceed
      }
    }

    // Calculate fare with actual rates
    double baseRate = widget.trip.baseRatePerKm ?? 13.0; // Default to 13 if not available
    double vehicleRate = widget.trip.vehicleBaseRate ?? 300.0; // Default to 300 if not available
    double convenienceFee = widget.trip.convenienceFee ?? 30.0; // Default to 30 if not available
    
    double baseFare = _totalDistance * baseRate;
    
    // Calculate extra charges
    double extraCharges = 0;
    extraCharges += double.tryParse(_petChargeController.text) ?? 0;
    extraCharges += double.tryParse(_permitChargeController.text) ?? 0;
    extraCharges += double.tryParse(_parkingChargeController.text) ?? 0;
    extraCharges += double.tryParse(_waitingChargeController.text) ?? 0;
    extraCharges += double.tryParse(_hillChargeController.text) ?? 0;
    extraCharges += double.tryParse(_tollChargeController.text) ?? 0;

    // Total fare = base fare + vehicle rate + extra charges + convenience fee (NO TAX)
    double totalFare = baseFare + vehicleRate + extraCharges + convenienceFee;

    // Show breakdown before submitting
    _showFareBreakdown(totalFare, baseFare, vehicleRate, extraCharges, convenienceFee);
  }

  void _showEndOtpRequiredDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.warning, color: Colors.red, size: 28),
            SizedBox(width: 8),
            Text('End OTP Required'),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'You must enter the End OTP before ending the trip.',
              style: TextStyle(fontSize: 16),
            ),
            SizedBox(height: 16),
            Text(
              'To get the End OTP:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text('1. Click "Get End OTP from Backend" button'),
            Text('2. Enter the 6-digit OTP in the End OTP field'),
            Text('3. Then submit the trip'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              _getEndOTP();
            },
            icon: const Icon(Icons.key),
            label: const Text('Get End OTP Now'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  // NEW state variable for Widget SDK
  String? _reqId;

  Future<void> _getEndOTP() async {
    setState(() => _loading = true);
    
    // NEW: Widget SDK Flow for End Trip
    try {
      // 1. Get Customer Phone from Trip Data
      String? customerPhone = widget.trip.raw['phone']?.toString() ?? 
                             widget.trip.raw['customer']?['phone']?.toString();
      
      if (customerPhone == null || customerPhone.isEmpty) {
        throw Exception("Customer phone number not found in trip data");
      }
      
      // Clean phone number
      customerPhone = customerPhone.replaceAll(RegExp(r'\D'), '');
      if (customerPhone.length == 10) {
        customerPhone = "91$customerPhone";
      }
      
      print('Sending End Trip OTP via Widget to: $customerPhone');

      // 2. Trigger Widget Send OTP
      final result = await OTPWidget.sendOTP({'identifier': customerPhone});
      
      if (result != null && result['type'] != 'error') {
        setState(() {
          _reqId = result['message']; // CORRECT: reqId is in 'message' field
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('End OTP Sent Successfully to $customerPhone'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        throw Exception(result?['message'] ?? "Failed to send OTP via Widget");
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send OTP: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submitAndEndTripConfirmed(double totalFare) async {
    // Validate End OTP is required - cannot proceed without it
    if (_endOtpController.text.trim().isEmpty) {
      Navigator.of(context).pop(); // Close fare breakdown dialog (already closed actually?)
      _showEndOtpRequiredDialog();
      return;
    }

    // Validate End Odometer is required
    if (_endOdo <= _startOdo) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter valid End Odometer reading (required, must be > start odometer)')),
      );
      return;
    }
    
    // Check if reqId/SendOTP was done
    if (_reqId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
         const SnackBar(content: Text('Please Send End OTP first')),
      );
      return;
    }

    setState(() => _loading = true);

    try {
      // 1. Verify End OTP via Widget SDK
      print('Verifying End OTP: ${_endOtpController.text} with reqId: $_reqId');
      final result = await OTPWidget.verifyOTP({
        'reqId': _reqId, 
        'otp': _endOtpController.text
      });
      
      if (result != null && result['type'] == 'error') {
        throw Exception(result['message'] ?? "OTP Verification Failed");
      } else if (result == null) {
        throw Exception("Unknown verification error (null result)");
      }
      
      // 2. Get Access Token
      final String accessToken = result['message']; 

      // 3. Prepare charges map for End Trip (Critical for invoice calculation)
      final driverCharges = {
        'Hill': double.tryParse(_hillChargeController.text) ?? 0.0,
        'Toll': double.tryParse(_tollChargeController.text) ?? 0.0,
        'Pet Charge': double.tryParse(_petChargeController.text) ?? 0.0,
        'Permit Charge': double.tryParse(_permitChargeController.text) ?? 0.0,
        'Parking Charge': double.tryParse(_parkingChargeController.text) ?? 0.0,
        'Waiting Charge': double.tryParse(_waitingChargeController.text) ?? 0.0,
      };

      // 4. End Trip (Record distance/duration, end odometer, End OTP, and Charges, and AccessToken)
      await widget.tripService.endTrip(
        token: widget.token,
        tripId: widget.trip.id,
        endOtp: _endOtpController.text,
        distance: _totalDistance,
        duration: _gpsDuration ?? 30, // Use GPS duration if available, otherwise default
        endOdometer: _endOdo,
        driverCharges: driverCharges,
        gpsPoints: widget.trackingResult?.gpsPointsJson, // Pass GPS trail data
        accessToken: accessToken, // Pass Widget Token
        // Extra charges as separate fields for backend
        hillCharge: double.tryParse(_hillChargeController.text) ?? 0.0,
        tollCharge: double.tryParse(_tollChargeController.text) ?? 0.0,
        petCharge: double.tryParse(_petChargeController.text) ?? 0.0,
        permitCharge: double.tryParse(_permitChargeController.text) ?? 0.0,
        parkingCharge: double.tryParse(_parkingChargeController.text) ?? 0.0,
        waitingCharge: double.tryParse(_waitingChargeController.text) ?? 0.0,
      );

      // 5. Complete Trip (Record payment/fare)
      // Get payment method from trip data, default to "Cash"
      final paymentMethod = widget.trip.raw['paymentMethod']?.toString() ?? 
                           widget.trip.raw['payment_method']?.toString() ?? 
                           'Cash';
      // Ensure it's one of the valid values: Cash, Link, or UPI
      final validPaymentMethod = ['Cash', 'Link', 'UPI'].contains(paymentMethod) 
          ? paymentMethod 
          : 'Cash';
      
      await widget.tripService.completeTrip(
        token: widget.token,
        tripId: widget.trip.id,
        fare: totalFare,
        paymentMethod: validPaymentMethod,
        hillCharge: double.tryParse(_hillChargeController.text) ?? 0.0,
        tollCharge: double.tryParse(_tollChargeController.text) ?? 0.0,
        petCharge: double.tryParse(_petChargeController.text) ?? 0.0,
        permitCharge: double.tryParse(_permitChargeController.text) ?? 0.0,
        parkingCharge: double.tryParse(_parkingChargeController.text) ?? 0.0,
        waitingCharge: double.tryParse(_waitingChargeController.text) ?? 0.0,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Trip Ended Successfully!')),
        );
        // Navigate back to home/trips
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      if (mounted) {
        String errorMessage = e.toString().replaceAll('Exception: ', '');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $errorMessage')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('End Trip Details'),
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
                  // GPS Tracking Info Card (if available)
                  if (_gpsDistance != null)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.green.shade50, Colors.teal.shade50],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.green.shade200),
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.green.shade100,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(Icons.gps_fixed, color: Colors.green.shade700, size: 20),
                              ),
                              const SizedBox(width: 12),
                              const Expanded(
                                child: Text(
                                  'GPS Tracking Data',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: Color(0xFF166534),
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.green.shade100,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '$_gpsPointCount points',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.green.shade800,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: _buildGpsInfoItem(
                                  icon: Icons.straighten,
                                  label: 'Distance',
                                  value: '${_gpsDistance!.toStringAsFixed(1)} km',
                                ),
                              ),
                              Container(width: 1, height: 40, color: Colors.green.shade200),
                              Expanded(
                                child: _buildGpsInfoItem(
                                  icon: Icons.timer_outlined,
                                  label: 'Duration',
                                  value: '${_gpsDuration ?? 0} min',
                                ),
                              ),
                            ],
                          ),
                        ],
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
                                const CircularProgressIndicator(color: Colors.blue),
                                const SizedBox(height: 16),
                                Text(
                                  'Reading odometer...',
                                  style: TextStyle(
                                    color: Colors.blue.shade700,
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
                                        color: Colors.blue.shade50,
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(Icons.document_scanner,
                                          size: 32, color: Colors.blue.shade700),
                                    ),
                                    const SizedBox(height: 12),
                                    const Text(
                                      '📷 Scan End Odometer',
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

                  // End ODO Value (Required)
                  const Row(
                    children: [
                      Text(
                        'End ODO meter Value',
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
                        controller: _endOdoController,
                        decoration: const InputDecoration(
                          hintText: 'Enter final odometer reading',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // End OTP (Required)
                  const Row(
                    children: [
                      Text(
                        'Customer End OTP',
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
                    controller: _endOtpController,
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
                    icon: const Icon(Icons.key),
                    label: const Text('Get OTP from Backend'),
                    onPressed: _getEndOTP,
                  ),
                  const SizedBox(height: 24),

                  // Extra Charges
                  const Text(
                    'Extra Charges',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  
                  _buildChargeInput('Hill', _hillChargeController),
                  const SizedBox(height: 16),
                  _buildChargeInput('Toll', _tollChargeController),
                  const SizedBox(height: 16),
                  _buildChargeInput('Pet Charge', _petChargeController),
                  const SizedBox(height: 16),
                  _buildChargeInput('Permit Charge', _permitChargeController),
                  const SizedBox(height: 16),
                  _buildChargeInput('Parking Charge', _parkingChargeController),
                  const SizedBox(height: 16),
                  _buildChargeInput('Waiting Charge', _waitingChargeController),
                  
                  const SizedBox(height: 32),

                  // Submit Button
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _submitAndEndTrip,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'End Trip',
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
                            'Ensure the final odometer reading is accurate. This will be used to calculate the trip distance and fare.',
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

  Widget _buildChargeInput(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.grey.shade700,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(
            prefixText: '₹ ',
            border: OutlineInputBorder(),
            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }

  Widget _buildGpsInfoItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(icon, color: Colors.green.shade700, size: 24),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF166534),
          ),
        ),
      ],
    );
  }
}
