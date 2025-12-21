import 'package:flutter/material.dart';

import '../api_client.dart';
import '../models/customer_models.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, required this.token});
  final String token;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);
  Customer? _customer;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadCustomerDetails();
  }

  Future<void> _loadCustomerDetails() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _apiClient.getCustomerDetails(token: widget.token);

      if (result.success && result.body['data'] != null) {
        setState(() {
          _customer = Customer.fromJson(result.body['data']);
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = result.body['message'] ?? 'Failed to load profile';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              _errorMessage!,
              style: const TextStyle(color: Colors.red),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadCustomerDetails,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_customer == null) {
      return const Center(child: Text('No customer data'));
    }

    return RefreshIndicator(
      onRefresh: _loadCustomerDetails,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundImage: _customer!.profilePicture != null
                          ? NetworkImage(_customer!.profilePicture!)
                          : null,
                      child: _customer!.profilePicture == null
                          ? const Icon(Icons.person, size: 50)
                          : null,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _customer!.name,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (_customer!.email != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        _customer!.email!,
                        style: const TextStyle(color: Colors.grey),
                      ),
                    ],
                    const SizedBox(height: 8),
                    Text(
                      _customer!.phone,
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Account Information',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildInfoRow('Customer ID', _customer!.customerId),
                    if (_customer!.referralCode != null)
                      _buildInfoRow('Referral Code', _customer!.referralCode!),
                    _buildInfoRow('Status', _customer!.status),
                    _buildInfoRow('Rating', _customer!.rating.toStringAsFixed(1)),
                    _buildInfoRow('Total Trips', _customer!.totalTrips.toString()),
                    _buildInfoRow('Total Bookings', _customer!.bookingCount.toString()),
                    _buildInfoRow('Total Amount', '₹${_customer!.totalAmount}'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => EditProfileScreen(
                      token: widget.token,
                      customer: _customer!,
                      onUpdated: _loadCustomerDetails,
                    ),
                  ),
                );
              },
              icon: const Icon(Icons.edit),
              label: const Text('Edit Profile'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 48),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(color: Colors.grey),
          ),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({
    super.key,
    required this.token,
    required this.customer,
    required this.onUpdated,
  });
  final String token;
  final Customer customer;
  final VoidCallback onUpdated;

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);

  static const List<String> _genderOptions = ['Male', 'Female', 'Other'];

  String? _selectedGender;
  DateTime? _selectedDob;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameController.text = widget.customer.name;
    _emailController.text = widget.customer.email ?? '';
    _phoneController.text = widget.customer.phone;
    _selectedGender =
        _genderOptions.contains(widget.customer.gender) ? widget.customer.gender : null;
    _selectedDob = widget.customer.dob;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final result = await _apiClient.updateCustomerProfile(
        token: widget.token,
        name: _nameController.text,
        email: _emailController.text.isEmpty ? null : _emailController.text,
        phone: _phoneController.text,
        gender: _selectedGender,
        dob: _selectedDob,
      );

      if (!mounted) return;

      if (result.success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully')),
        );
        widget.onUpdated();
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.body['message'] ?? 'Failed to update profile')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _selectDate() async {
    final now = DateTime.now();
    final initialDate = _selectedDob ?? now;
    final safeInitialDate = initialDate.isAfter(now) ? now : initialDate;

    final picked = await showDatePicker(
      context: context,
      initialDate: safeInitialDate,
      firstDate: DateTime(1900),
      lastDate: now,
    );
    if (picked != null) {
      setState(() {
        _selectedDob = picked;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final genderValue = _genderOptions.contains(_selectedGender) ? _selectedGender : null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameController,
              readOnly: true,
              decoration: InputDecoration(
                labelText: 'Name',
                border: const OutlineInputBorder(),
                filled: true,
                fillColor: Colors.grey[200],
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter your name';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phoneController,
              readOnly: true,
              decoration: InputDecoration(
                labelText: 'Phone',
                border: const OutlineInputBorder(),
                filled: true,
                fillColor: Colors.grey[200],
              ),
              keyboardType: TextInputType.phone,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter your phone number';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: genderValue,
              decoration: const InputDecoration(
                labelText: 'Gender',
                border: OutlineInputBorder(),
              ),
              items: _genderOptions
                  .map(
                    (gender) => DropdownMenuItem(
                      value: gender,
                      child: Text(gender),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                setState(() {
                  _selectedGender = value;
                });
              },
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: _selectDate,
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Date of Birth',
                  border: OutlineInputBorder(),
                ),
                child: Text(
                  _selectedDob != null
                      ? '${_selectedDob!.day}/${_selectedDob!.month}/${_selectedDob!.year}'
                      : 'Select date',
                ),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _saveProfile,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Save Changes'),
            ),
          ],
        ),
      ),
    );
  }
}
