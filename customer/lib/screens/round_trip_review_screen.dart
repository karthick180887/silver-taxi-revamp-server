import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api_client.dart';

class RoundTripReviewScreen extends StatefulWidget {
  const RoundTripReviewScreen({
    super.key,
    required this.token,
    required this.pickupLocation,
    required this.dropLocation,
    required this.pickupDateTime,
    required this.vehicleTypeId,
    required this.finalAmount,
    this.phone,
    required this.distance,
    required this.pricePerKm,
    required this.driverBeta,
    // minKm is implicit 250
  });
  final String token;
  final Map<String, dynamic> pickupLocation;
  final Map<String, dynamic> dropLocation;
  final DateTime pickupDateTime;
  final String vehicleTypeId;
  final double finalAmount;
  final String? phone;
  final double distance;
  final double pricePerKm;
  final double driverBeta;

  final double minKm = 250.0; // Hardcoded for Round Trip
  final String tripType = "Round Trip"; // Hardcoded for Round Trip

  @override
  State<RoundTripReviewScreen> createState() => _RoundTripReviewScreenState();
}

class _RoundTripReviewScreenState extends State<RoundTripReviewScreen> {
  final _apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);
  String _paymentMethod = 'Cash';
  bool _isCreating = false;
  String? _errorMessage;

  bool _isOfferApplied = false; 

  Map<String, dynamic> _calculateFareBreakdown() {
    final distance = widget.distance;
    final minKm = widget.minKm;
    final billableKm = distance < minKm ? minKm : distance;
    
    final perKmPrice = widget.pricePerKm;
    final driverBeta = widget.driverBeta;
    
    // Calculate base fare
    final kmBaseFare = billableKm * perKmPrice;
    
    final subTotal = kmBaseFare + driverBeta;
    
    // Calculate Discount (5% if applied)
    final discount = _isOfferApplied ? (subTotal * 0.05) : 0.0;
    
    final calculatedTotal = subTotal - discount;

    return {
      'totalKm': billableKm,
      'actualDistance': distance,
      'perKmPrice': perKmPrice,
      'kmBaseFare': kmBaseFare,
      'driverBeta': driverBeta,
      'discount': discount,
      'finalAmount': calculatedTotal,
      'minKm': minKm
    };
  }
  
  Future<void> _createBooking() async {
    setState(() {
      _isCreating = true;
      _errorMessage = null;
    });

    try {
      final fareBreakdown = _calculateFareBreakdown();

      // Normalize tripType for API
      final apiTripType = "Round Trip"; 

      final result = await _apiClient.createBooking(
        token: widget.token,
        pickupLocation: widget.pickupLocation,
        dropLocation: widget.dropLocation,
        vehicleTypeId: widget.vehicleTypeId,
        finalAmount: (fareBreakdown['finalAmount'] as num).round(),
        estimatedAmount: (fareBreakdown['kmBaseFare'] as num).round(),
        paymentMethod: _paymentMethod,
        tripType: apiTripType,
        pickupDateTime: widget.pickupDateTime,
        phone: widget.phone,
      );

      if (result.success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Round Trip Booking created successfully!'),
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
        debugPrint('Booking creation failed:');
        debugPrint('Status: $statusCode');
        debugPrint('URL: $url');
        debugPrint('Response: ${result.body}');
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
        title: const Text('Round Trip'), // Hardcoded Title
        backgroundColor: Colors.amber, 
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
                  _buildFeatureTag('Round Trip Special', highlight: true),
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
                      color: Colors.amber[50], // Keep amber for Round Trip too
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.amber.withOpacity(0.5)),
                    ),
                    child: Column(
                      children: [
                        _buildFareRow(
                          'Total Km',
                          '${(fareBreakdown['totalKm'] as double).toStringAsFixed(1)} km',
                          subtitle: '(Min ${widget.minKm.toStringAsFixed(0)} Km - Round Trip)',
                        ),
                        const Divider(),
                        _buildFareRow('Per Km Price', '₹${fareBreakdown['perKmPrice']}'),
                        const Divider(),
                        _buildFareRow('Km Base Fare', '₹${(fareBreakdown['kmBaseFare'] as double).toStringAsFixed(1)}'),
                        const Divider(),
                        _buildFareRow('Driver Beta', '₹${fareBreakdown['driverBeta']}'),
                        const Divider(),
                        _buildFareRow(
                          'Offer Discount',
                          '-₹${(fareBreakdown['discount'] as double).toStringAsFixed(1)}',
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
                          '₹${(fareBreakdown['finalAmount'] as double).toStringAsFixed(1)}',
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
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    setState(() {
                      _isOfferApplied = !_isOfferApplied;
                    });
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: _isOfferApplied ? Colors.amber : Colors.grey[200],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _isOfferApplied ? Colors.amber : Colors.grey[400]!,
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Welcome - 5%',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: _isOfferApplied ? Colors.black : Colors.grey[600],
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
                              const Icon(
                                Icons.local_offer,
                                color: Colors.amber,
                                size: 16,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                _isOfferApplied 
                                    ? 'Applied: -₹${fareBreakdown['discount'].toStringAsFixed(1)}'
                                    : 'Apply Offer',
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
              ),
            ),

            const SizedBox(height: 24),

            // Description
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Description',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
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
              color: Colors.black.withValues(alpha: 0.1),
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

  Widget _buildFeatureTag(String text, {bool highlight = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: highlight ? Colors.amber : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: highlight ? Colors.amber : Colors.grey[300]!),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: highlight ? FontWeight.bold : FontWeight.normal,
        ),
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
