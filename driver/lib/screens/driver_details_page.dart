import 'package:flutter/material.dart';

import '../api_client.dart';

class DriverDetailsPage extends StatefulWidget {
  final String token;
  const DriverDetailsPage({super.key, required this.token});

  @override
  State<DriverDetailsPage> createState() => _DriverDetailsPageState();
}

class _DriverDetailsPageState extends State<DriverDetailsPage> {
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _data;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _api.fetchDriverDetails(token: widget.token);
      final data = res['data'] ?? res;
      if (mounted) {
        setState(() {
          _data = Map<String, dynamic>.from(data);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Driver Details')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null || _data == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Driver Details')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_error ?? 'Failed to load driver details', style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: _load, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    final profile = _data!;
    final docs = Map<String, dynamic>.from(profile['documents'] ?? {});

    String _pickDoc(List<String> keys) {
      for (final k in keys) {
        final v = docs[k] ?? profile[k];
        if (v != null && v.toString().isNotEmpty) return v.toString();
      }
      return '';
    }

    final aadharFront = _pickDoc(['aadharFront', 'aadharFrontImage', 'aadhar_front', 'aadhaarFront', 'aadhaarFrontImage']);
    final aadharBack = _pickDoc(['aadharBack', 'aadharBackImage', 'aadhar_back', 'aadhaarBack', 'aadhaarBackImage']);
    final licenseFront = _pickDoc(['dlFront', 'licenseFront', 'license_front', 'licenseFrontImage']);
    final licenseBack = _pickDoc(['dlBack', 'licenseBack', 'license_back', 'licenseBackImage']);
    final panCard = _pickDoc(['panCard', 'panCardImage', 'pan', 'pan_card']);
    final driverPhoto = _pickDoc(['driverCurrentPhoto', 'driverImageUrl', 'profilePicture', 'driver_photo']);
    final dlExpiry = _pickDoc(['dlExpiry', 'licenseExpiry', 'license_expiry']);

    final name = (profile['name'] ?? '').toString();
    final phone = (profile['phone'] ?? '').toString();
    final address = (profile['address'] ?? '').toString();
    final gender = (profile['gender'] ?? '').toString();
    final dob = (profile['dob'] ?? profile['dateOfBirth'] ?? '').toString();
    final bookingCount = profile['bookingCount'] ?? 0;
    final totalEarnings = (profile['totalEarnings'] ?? 0).toString();
    final avatar = profile['driverImageUrl'] ?? profile['profilePicture'] ?? profile['documents']?['driverCurrentPhoto'];

    Widget docCard(String title, String? url, {String? validity}) {
      final hasImage = url != null && url.isNotEmpty;
      return Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 6,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            AspectRatio(
              aspectRatio: 1,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: hasImage
                    ? Image.network(url!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _placeholder())
                    : _placeholder(),
              ),
            ),
            if (validity != null && validity.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Text('Validity', style: TextStyle(fontSize: 14, color: Colors.black54)),
              const SizedBox(height: 4),
              Text(validity, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
            ],
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Driver Details')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 60,
                    backgroundImage: avatar != null && avatar.toString().isNotEmpty ? NetworkImage(avatar) : null,
                    child: avatar == null || avatar.toString().isEmpty ? const Icon(Icons.person, size: 60) : null,
                  ),
                  const SizedBox(height: 12),
                  Text(name.isNotEmpty ? name : 'Driver', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  if (phone.isNotEmpty) Text(phone, style: const TextStyle(fontSize: 14, color: Colors.black54)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            _sectionCard(
              title: 'Personal Info',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _infoRow('Name', name),
                  _infoRow('Phone', phone),
                  _infoRow('Address', address),
                  _infoRow('Gender', gender),
                  _infoRow('Date of Birth', dob),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _sectionCard(
              title: 'Stats',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _infoRow('Booking Count', bookingCount.toString()),
                  _infoRow('Total Earnings', totalEarnings),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text('Documents', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.8,
              children: [
                docCard('Aadhar Front', aadharFront),
                docCard('Aadhar Back', aadharBack),
                docCard('License Front', licenseFront, validity: dlExpiry),
                docCard('License Back', licenseBack, validity: dlExpiry),
                docCard('PAN Card', panCard),
                docCard('Driver Photo', driverPhoto),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionCard({required String title, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$label: ', style: const TextStyle(fontWeight: FontWeight.w600)),
          Expanded(child: Text(value.isNotEmpty ? value : '-', style: const TextStyle(color: Colors.black87))),
        ],
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      color: Colors.grey.shade200,
      child: const Center(
        child: Icon(Icons.image_not_supported, color: Colors.grey),
      ),
    );
  }
}

