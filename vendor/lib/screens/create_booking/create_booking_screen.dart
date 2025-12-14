import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../api_client.dart';
import '../../design_system.dart';

class CreateBookingScreen extends StatefulWidget {
  const CreateBookingScreen({super.key});

  @override
  State<CreateBookingScreen> createState() => _CreateBookingScreenState();
}

class _CreateBookingScreenState extends State<CreateBookingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _pickupController = TextEditingController();
  final _dropoffController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  
  // Example selections
  String _serviceType = 'Cab'; 
  String _tripType = 'One Way';
  
  bool _isLoading = false;
  final _api = VendorApiClient();

  Future<void> _submitBooking() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('vendor_token');
      final adminId = prefs.getString('admin_id');
      final vendorId = prefs.getString('vendor_id');
      
      if (token == null) return;

      final bookingData = {
        'pickupLocation': _pickupController.text, // Simplified, real app needs LatLng
        'dropoffLocation': _dropoffController.text,
        'customerName': _nameController.text,
        'customerPhone': _phoneController.text,
        'serviceType': _serviceType,
        'tripType': _tripType,
        if (adminId != null) 'adminId': adminId,
        if (vendorId != null) 'vendorId': vendorId,
        // Add other required fields by API
      };

      // Call createBooking API (assuming it handles raw address strings or we need geocoding first)
      // For this demo, we assume API might need more, but we send what we have.
      final res = await _api.createBooking(token: token, data: bookingData);
      
      if (mounted) {
        if (res.statusCode == 200 || res.statusCode == 201) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Booking Created Successfully!'), backgroundColor: AppColors.success),
          );
          _pickupController.clear();
          _dropoffController.clear();
          _nameController.clear();
          _phoneController.clear();
        } else {
             ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed: ${res.message}'), backgroundColor: AppColors.error),
          );
        }
      }

    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) {
         setState(() => _isLoading = false);
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Booking')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Customer Details', style: AppTextStyles.h3),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Customer Name',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                validator: (v) => v?.isNotEmpty == true ? null : 'Required',
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
                validator: (v) => v?.isNotEmpty == true ? null : 'Required',
              ),
              
              const SizedBox(height: 24),
              Text('Trip Details', style: AppTextStyles.h3),
              const SizedBox(height: 16),
              
              DropdownButtonFormField<String>(
                value: _serviceType,
                decoration: const InputDecoration(labelText: 'Service Type'),
                items: ['Cab', 'Auto', 'Bike'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (v) => setState(() => _serviceType = v!),
              ),
              const SizedBox(height: 12),
               DropdownButtonFormField<String>(
                value: _tripType,
                decoration: const InputDecoration(labelText: 'Trip Type'),
                items: ['One Way', 'Round Trip'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (v) => setState(() => _tripType = v!),
              ),
              const SizedBox(height: 12),
              
              TextFormField(
                controller: _pickupController,
                decoration: const InputDecoration(
                  labelText: 'Pickup Location',
                  prefixIcon: Icon(Icons.my_location),
                ),
                 validator: (v) => v?.isNotEmpty == true ? null : 'Required',
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _dropoffController,
                decoration: const InputDecoration(
                  labelText: 'Dropoff Location',
                  prefixIcon: Icon(Icons.location_on_outlined),
                ),
                 validator: (v) => v?.isNotEmpty == true ? null : 'Required',
              ),
              
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isLoading ? null : _submitBooking,
                child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Create Booking'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
