import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api_client.dart';
import '../models/customer_models.dart';

class BookingReviewScreen extends StatefulWidget {
  const BookingReviewScreen({
    super.key,
    required this.token,
    required this.pickupLocation,
    required this.dropLocation,
    required this.pickupDateTime,
    required this.serviceType,
    required this.vehicle,
    required this.fare,
    this.returnDate,
    this.serviceId,
  });
  final String token;
  final Map<String, dynamic> pickupLocation;
  final Map<String, dynamic> dropLocation;
  final DateTime pickupDateTime;
  final DateTime? returnDate;
  final String serviceType;
  final String? serviceId;
  final EstimatedVehicle vehicle;
  final EstimatedFare fare;

  @override
  State<BookingReviewScreen> createState() => _BookingReviewScreenState();
}

class _BookingReviewScreenState extends State<BookingReviewScreen> {
  final _apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);
  String _paymentMethod = 'Cash';
  bool _isCreating = false;
  String? _errorMessage;

  Future<void> _createBooking() async {
    setState(() {
      _isCreating = true;
      _errorMessage = null;
    });

    try {
      final payload = <String, dynamic>{
        'pickup': widget.pickupLocation['address'],
        'drop': widget.dropLocation['address'],
        'pickupDateTime': widget.pickupDateTime.toIso8601String(),
        if (widget.returnDate != null) 'dropDate': widget.returnDate!.toIso8601String(),
        'serviceType': widget.serviceType,
        'serviceId': widget.serviceId,
        'vehicleId': widget.vehicle.vehicleId,
        'vehicleType': widget.vehicle.vehicleType,
        'tariffId': widget.fare.tariffId,
        'packageId': widget.fare.packageId,
        'finalAmount': widget.fare.finalPrice,
        'estimatedAmount': widget.fare.estimatedPrice,
        'distance': widget.fare.distance,
        'duration': widget.fare.duration,
        'driverBeta': widget.fare.driverBeta,
        'pricePerKm': widget.fare.pricePerKm,
        'taxPercentage': widget.fare.taxPercentage,
        'taxAmount': widget.fare.taxAmount,
        'toll': widget.fare.toll,
        'hill': widget.fare.hill,
        'permitCharge': widget.fare.permitCharge,
        'offerId': widget.fare.offerId,
        'offerAmount': widget.fare.offerAmount,
        'paymentMethod': _paymentMethod,
        'paymentStatus': _paymentMethod == 'Cash' ? 'Unpaid' : 'Paid',
        'createdBy': 'User',
        'type': 'App',
      };

      final result = await _apiClient.createBooking(
        token: widget.token,
        payload: payload,
      );

      if (result.success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Booking created successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      } else {
        final errorMsg =
            result.body['message'] ?? result.body['error'] ?? 'Failed to create booking';
        final statusCode = result.statusCode;
        final url = result.body['url'] ?? '';

        setState(() {
          _errorMessage = statusCode == 404
              ? 'Endpoint not found. Please check:\n1. Backend server is running\n2. API URL: $url\n3. Route: /customer/booking/create'
              : '$errorMsg (Status: $statusCode)';
          _isCreating = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: $e';
        _isCreating = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.serviceType),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Trip summary
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.vehicle.vehicleType,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${widget.pickupLocation['address']} → ${widget.dropLocation['address']}',
                    style: const TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Pickup: ${DateFormat('d MMM yyyy, h:mm a').format(widget.pickupDateTime)}',
                    style: const TextStyle(color: Colors.grey),
                  ),
                  if (widget.returnDate != null)
                    Text(
                      'Return: ${DateFormat('d MMM yyyy').format(widget.returnDate!)}',
                      style: const TextStyle(color: Colors.grey),
                    ),
                ],
              ),
            ),

            // Fare Details
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Fare Details',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.amber[50],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        _buildFareRow('Estimated Price', '₹${widget.fare.estimatedPrice}'),
                        if (widget.fare.taxAmount != null) const Divider(),
                        if (widget.fare.taxAmount != null)
                          _buildFareRow(
                            'Tax',
                            '₹${widget.fare.taxAmount}',
                            subtitle: widget.fare.taxPercentage != null
                                ? '${widget.fare.taxPercentage}%'
                                : null,
                          ),
                        if (widget.fare.driverBeta != null) const Divider(),
                        if (widget.fare.driverBeta != null)
                          _buildFareRow('Driver Beta', '₹${widget.fare.driverBeta}'),
                        if (widget.fare.offerAmount != null) const Divider(),
                        if (widget.fare.offerAmount != null)
                          _buildFareRow(
                            'Offer',
                            '-₹${widget.fare.offerAmount}',
                            isDiscount: true,
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2575FC),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Fare',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '₹${widget.fare.finalPrice}',
                          style: const TextStyle(
                            color: Colors.amber,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Payment Method Selection
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Payment Method',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildPaymentMethodButton(
                          'Cash',
                          Icons.money,
                          _paymentMethod == 'Cash',
                          () => setState(() => _paymentMethod = 'Cash'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildPaymentMethodButton(
                          'Wallet',
                          Icons.account_balance_wallet,
                          _paymentMethod == 'Wallet',
                          () => setState(() => _paymentMethod = 'Wallet'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            if (_errorMessage != null) ...[
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Error',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.red,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Failed to create booking: $_errorMessage',
                        style: const TextStyle(color: Colors.red),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: 32),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF2575FC),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 4,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Total Fare',
                    style: TextStyle(
                      color: Colors.white70,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₹${widget.fare.finalPrice}',
                    style: const TextStyle(
                      color: Colors.amber,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: _isCreating ? null : _createBooking,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  backgroundColor: Colors.amber,
                  foregroundColor: Colors.black,
                ),
                child: _isCreating
                    ? const CircularProgressIndicator()
                    : const Text(
                        'Confirm',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFareRow(String label, String value, {String? subtitle, bool isDiscount = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                color: isDiscount ? Colors.red : Colors.black,
                fontWeight: FontWeight.w500,
              ),
            ),
            if (subtitle != null)
              Text(
                subtitle,
                style: const TextStyle(
                  color: Colors.grey,
                  fontSize: 12,
                ),
              ),
          ],
        ),
        Text(
          value,
          style: TextStyle(
            color: isDiscount ? Colors.red : Colors.black,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentMethodButton(
    String label,
    IconData icon,
    bool isSelected,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.amber : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? Colors.amber : Colors.grey[300]!,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.black : Colors.grey,
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.black : Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api_client.dart';
import '../models/customer_models.dart';

class BookingReviewScreen extends StatefulWidget {
  const BookingReviewScreen({
    super.key,
    required this.token,
    required this.pickupLocation,
    required this.dropLocation,
    required this.pickupDateTime,
    required this.tripType,
    required this.vehicleTypeId,
    required this.finalAmount,
  });
  final String token;
  final Map<String, dynamic> pickupLocation;
  final Map<String, dynamic> dropLocation;
  final DateTime pickupDateTime;
  final String tripType;
  final String vehicleTypeId;
  final double finalAmount;

  @override
  State<BookingReviewScreen> createState() => _BookingReviewScreenState();
}

class _BookingReviewScreenState extends State<BookingReviewScreen> {
  final _apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);
  String _paymentMethod = 'Cash';
  bool _isCreating = false;
  String? _errorMessage;

  // Calculate fare breakdown (mock calculation)
  Map<String, dynamic> _calculateFareBreakdown() {
    // Mock calculation - In production, calculate based on distance
    final totalKm = 168.0;
    final perKmPrice = 12.0;
    final kmBaseFare = totalKm * perKmPrice;
    final driverBeta = 300.0;
    final discount = 101.0;
    final finalAmount = widget.finalAmount;

    return {
      'totalKm': totalKm,
      'perKmPrice': perKmPrice,
      'kmBaseFare': kmBaseFare,
      'driverBeta': driverBeta,
      'discount': discount,
      'finalAmount': finalAmount,
    };
  }

  Future<void> _createBooking() async {
    setState(() {
      _isCreating = true;
      _errorMessage = null;
    });

    try {
      final fareBreakdown = _calculateFareBreakdown();

      final result = await _apiClient.createBooking(
        token: widget.token,
        pickupLocation: widget.pickupLocation,
        dropLocation: widget.dropLocation,
        vehicleTypeId: widget.vehicleTypeId,
        finalAmount: widget.finalAmount,
        estimatedAmount: fareBreakdown['kmBaseFare'] as double,
        paymentMethod: _paymentMethod,
        tripType: widget.tripType,
        pickupDateTime: widget.pickupDateTime,
      );

      if (result.success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Booking created successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      } else {
        final errorMsg = result.body['message'] ?? 
                        result.body['error'] ?? 
                        'Failed to create booking';
        final statusCode = result.statusCode;
        final url = result.body['url'] ?? '';
        
        setState(() {
          _errorMessage = statusCode == 404 
              ? 'Endpoint not found. Please check:\n1. Backend server is running\n2. API URL: $url\n3. Route: /customer/bookings'
              : '$errorMsg (Status: $statusCode)';
          _isCreating = false;
        });
        
        // Print debug info
        print('Booking creation failed:');
        print('Status: $statusCode');
        print('URL: $url');
        print('Response: ${result.body}');
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: $e';
        _isCreating = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final fareBreakdown = _calculateFareBreakdown();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.tripType == 'one_way' ? 'One Way Trip' : 'Round Trip',
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Feature Tags
            Padding(
              padding: const EdgeInsets.all(16),
              child: Wrap(
                spacing: 8,
                children: [
                  _buildFeatureTag('AC'),
                  _buildFeatureTag('Safe'),
                  _buildFeatureTag('Hassle free'),
                  _buildFeatureTag('Luggage'),
                ],
              ),
            ),

            // Date & Time
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Date & Time',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Pickup Date, ${DateFormat('d MMM yyyy, h:mm a').format(widget.pickupDateTime)}',
                    style: const TextStyle(fontSize: 16),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Fare Details
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Fare Details',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.amber[50],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        _buildFareRow(
                          'Total Km',
                          '${fareBreakdown['totalKm']} km',
                          subtitle: '(Min 130 Km Per Day)',
                        ),
                        const Divider(),
                        _buildFareRow('Per Km Price', '₹${fareBreakdown['perKmPrice']}'),
                        const Divider(),
                        _buildFareRow('Km Base Fare', '₹${fareBreakdown['kmBaseFare']}'),
                        const Divider(),
                        _buildFareRow('Driver Beta', '₹${fareBreakdown['driverBeta']}'),
                        const Divider(),
                        _buildFareRow(
                          'Offer Discount',
                          '-₹${fareBreakdown['discount']}',
                          isDiscount: true,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2575FC),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Fare',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '₹${widget.finalAmount}',
                          style: const TextStyle(
                            color: Colors.amber,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Discount Banner
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.amber,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Welcome - 5%',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.local_offer, color: Colors.amber, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            'Save ₹${fareBreakdown['discount']}',
                            style: const TextStyle(
                              color: Colors.amber,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Description
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Description',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Toll fees, Inter-State Permit, Waiting charges, Parking Charges, Pet Charges, Hills Station charges (if any) are extra.',
                    style: TextStyle(
                      color: Colors.grey,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Payment Method Selection
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Payment Method',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildPaymentMethodButton(
                          'Cash',
                          Icons.money,
                          _paymentMethod == 'Cash',
                          () => setState(() => _paymentMethod = 'Cash'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildPaymentMethodButton(
                          'Wallet',
                          Icons.account_balance_wallet,
                          _paymentMethod == 'Wallet',
                          () => setState(() => _paymentMethod = 'Wallet'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            if (_errorMessage != null) ...[
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Error',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.red,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Failed to create booking: $_errorMessage',
                        style: const TextStyle(color: Colors.red),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: 32),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF2575FC),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 4,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isCreating ? null : _createBooking,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              backgroundColor: Colors.amber,
              foregroundColor: Colors.black,
            ),
            child: _isCreating
                ? const CircularProgressIndicator()
                : const Text(
                    'Swipe to Ride',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureTag(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Text(
        text,
        style: const TextStyle(fontSize: 12),
      ),
    );
  }

  Widget _buildFareRow(String label, String value, {String? subtitle, bool isDiscount = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 14),
              ),
              if (subtitle != null)
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
            ],
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: isDiscount ? Colors.green : Colors.black,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodButton(
    String label,
    IconData icon,
    bool isSelected,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? Colors.amber[50] : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? Colors.amber : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.amber, size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            if (isSelected) ...[
              const SizedBox(width: 4),
              const Icon(Icons.keyboard_arrow_down, size: 20),
            ],
          ],
        ),
      ),
    );
  }
}

