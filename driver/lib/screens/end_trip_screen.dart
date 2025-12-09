import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../api_client.dart';
import '../models/trip_models.dart';
import '../services/trip_service.dart';

class EndTripScreen extends StatefulWidget {
  const EndTripScreen({
    super.key,
    required this.trip,
    required this.token,
    required this.tripService,
  });

  final TripModel trip;
  final String token;
  final TripService tripService;

  @override
  State<EndTripScreen> createState() => _EndTripScreenState();
}

class _EndTripScreenState extends State<EndTripScreen> {
  final _endOdoController = TextEditingController();
  final _endOtpController = TextEditingController(); // Added for End OTP
  final _petChargeController = TextEditingController(text: '0');
  final _permitChargeController = TextEditingController(text: '0');
  final _parkingChargeController = TextEditingController(text: '0');
  final _waitingChargeController = TextEditingController(text: '0');
  final _hillChargeController = TextEditingController(text: '0');
  final _tollChargeController = TextEditingController(text: '0');

  File? _odoImage;
  final ImagePicker _picker = ImagePicker();
  final _api = ApiClient(baseUrl: kApiBaseUrl); // Added for OTP fetching
  bool _loading = false;

  // Odometer values
  double _startOdo = 0.0;
  double _endOdo = 0.0;
  double _totalDistance = 0.0;

  @override
  void initState() {
    super.initState();
    // Initialize from trip data if available
    _startOdo = widget.trip.startOdometer ?? 0.0;
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
    final XFile? photo = await _picker.pickImage(source: ImageSource.camera);
    if (photo != null) {
      setState(() {
        _odoImage = File(photo.path);
      });
    }
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
            content: Column(
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
        });
      }
    });
  }

  void _showFareBreakdown(double totalFare, double baseFare, double vehicleFare, double extraCharges) {
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

    // Calculate fare with actual rates
    double baseRate = widget.trip.baseRatePerKm ?? 13.0; // Default to 13 if not available
    double vehicleRate = widget.trip.vehicleBaseRate ?? 300.0; // Default to 300 if not available
    
    double baseFare = _totalDistance * baseRate;
    
    // Calculate extra charges
    double extraCharges = 0;
    extraCharges += double.tryParse(_petChargeController.text) ?? 0;
    extraCharges += double.tryParse(_permitChargeController.text) ?? 0;
    extraCharges += double.tryParse(_parkingChargeController.text) ?? 0;
    extraCharges += double.tryParse(_waitingChargeController.text) ?? 0;
    extraCharges += double.tryParse(_hillChargeController.text) ?? 0;
    extraCharges += double.tryParse(_tollChargeController.text) ?? 0;

    double totalFare = baseFare + vehicleRate + extraCharges;

    // Show breakdown before submitting
    _showFareBreakdown(totalFare, baseFare, vehicleRate, extraCharges);
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
            Text('2. Enter the 4-digit OTP in the End OTP field'),
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

  Future<void> _getEndOTP() async {
    setState(() => _loading = true);
    try {
      final res = await _api.sendTripOtp(
        token: widget.token,
        tripId: widget.trip.id,
        type: 'end',
      );

      if (res.success && res.body['data'] != null) {
        final otp = res.body['data']['otp']?.toString() ?? '';
        setState(() {
          _endOtpController.text = otp;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('End OTP: $otp')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to get End OTP: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submitAndEndTripConfirmed(double totalFare) async {
    // Validate End OTP is required - cannot proceed without it
    if (_endOtpController.text.trim().isEmpty) {
      Navigator.of(context).pop(); // Close fare breakdown dialog
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

    setState(() => _loading = true);

    try {
      // 1. End Trip (Record distance/duration, end odometer, and End OTP)
      await widget.tripService.endTrip(
        token: widget.token,
        tripId: widget.trip.id,
        endOtp: _endOtpController.text,
        distance: _totalDistance,
        duration: 30, // Mock duration in minutes
        endOdometer: _endOdo,
      );

      // 2. Complete Trip (Record payment/fare)
      await widget.tripService.completeTrip(
        token: widget.token,
        tripId: widget.trip.id,
        fare: totalFare,
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
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
                                    color: Colors.blue.shade50,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(Icons.camera_alt,
                                      size: 32, color: Colors.blue.shade700),
                                ),
                                const SizedBox(height: 12),
                                const Text(
                                  'Take End ODO Meter Photo',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Tap to capture final odometer reading\n(Optional)',
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
}
