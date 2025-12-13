import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'api_client.dart';
import 'screens/waiting_page.dart';

// ---------------------------------------------------------------------------
// 1. Welcome Screen
// ---------------------------------------------------------------------------
class WelcomeScreen extends StatelessWidget {
  final String token;
  const WelcomeScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.local_taxi, size: 80, color: Colors.blue),
              const SizedBox(height: 24),
              const Text(
                'Welcome to Silver Taxi,\nDriver Partner!',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 48),
              ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => VerificationDashboard(token: token),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('Update Your KYC', style: TextStyle(fontSize: 18)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 2. Verification Dashboard
// ---------------------------------------------------------------------------
class VerificationDashboard extends StatefulWidget {
  final String token;
  const VerificationDashboard({super.key, required this.token});

  @override
  State<VerificationDashboard> createState() => _VerificationDashboardState();
}

class _VerificationDashboardState extends State<VerificationDashboard> {
  late ApiClient _api;
  bool _loading = true;
  Map<String, dynamic>? _driverData;
  List<dynamic> _vehicles = [];

  @override
  void initState() {
    super.initState();
    _api = ApiClient(baseUrl: kApiBaseUrl);
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _loading = true);
    try {
      final driverRes = await _api.fetchDriverDetails(token: widget.token);
      final vehiclesRes = await _api.getDriverVehicles(token: widget.token);
      
      setState(() {
        _driverData = driverRes['data'];
        if (vehiclesRes.success) {
          // Handle the case where data is a List or a Map with vehicles key
          final vehicleData = vehiclesRes.body['data'];
          if (vehicleData is List) {
            _vehicles = vehicleData;
          } else if (vehicleData is Map && vehicleData['vehicles'] is List) {
            _vehicles = vehicleData['vehicles'] as List;
          } else {
            _vehicles = [];
          }
        }
      });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading data: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  bool _isPersonalInfoCompleted() {
    if (_driverData == null) return false;
    // Check if key fields exist and are not empty
    return _driverData!['name'] != null && _driverData!['name'].toString().isNotEmpty &&
           _driverData!['dateOfBirth'] != null && _driverData!['dateOfBirth'].toString().isNotEmpty &&
           _driverData!['address'] != null && _driverData!['address'].toString().isNotEmpty;
  }

  bool _isPersonalDocsCompleted() {
    if (_driverData == null) return false;
    // Backend stores documents with field names: panCardImage, licenseImageFront, licenseImageBack, driverImageUrl
    // Check for backend field names (primary) and Flutter field names (fallback for backward compatibility)
    final panCard = _driverData!['panCardImage'] ?? _driverData!['panCard'];
    final dlFront = _driverData!['licenseImageFront'] ?? _driverData!['dlFront'];
    final dlBack = _driverData!['licenseImageBack'] ?? _driverData!['dlBack'];
    final photo = _driverData!['driverImageUrl'] ?? _driverData!['driverCurrentPhoto'];
    
    // All four documents must be present and non-empty
    return panCard != null && panCard.toString().isNotEmpty &&
           dlFront != null && dlFront.toString().isNotEmpty &&
           dlBack != null && dlBack.toString().isNotEmpty &&
           photo != null && photo.toString().isNotEmpty;
  }

  bool _isVehicleDetailsCompleted() {
    return _vehicles.isNotEmpty;
  }

  bool _isVehicleDocsCompleted() {
    if (_vehicles.isEmpty) return false;
    final v = _vehicles.first; // Assuming single vehicle for now
    // Backend stores documents directly on vehicle object with field names:
    // rcBookImageFront, rcBookImageBack, insuranceImage, pollutionImage
    final rcFront = v['rcBookImageFront'] ?? v['rcFront'];
    final rcBack = v['rcBookImageBack'] ?? v['rcBack'];
    final insurance = v['insuranceImage'] ?? v['insuranceDoc'];
    final pollution = v['pollutionImage'] ?? v['pollutionDoc'];
    
    // All four documents must be present and non-empty
    return rcFront != null && rcFront.toString().isNotEmpty &&
           rcBack != null && rcBack.toString().isNotEmpty &&
           insurance != null && insurance.toString().isNotEmpty &&
           pollution != null && pollution.toString().isNotEmpty;
  }

  Future<void> _submitKYC() async {
    setState(() => _loading = true);
    try {
      final res = await _api.submitKYC(token: widget.token);
      if (res.success) {
        if (mounted) {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(
              builder: (_) => const WaitingPage(
                title: 'Under Review',
                message: 'Your KYC has been submitted successfully!\n\nYour profile is under admin review. You will be notified once approved.',
              ),
            ),
            (route) => false,
          );
        }
      } else {
        throw Exception(res.body['message'] ?? 'Submission failed');
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

  Widget _buildStep(String title, bool isCompleted, VoidCallback onTap) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: ListTile(
        title: Text(title),
        trailing: Icon(
          isCompleted ? Icons.check_circle : Icons.arrow_forward_ios,
          color: isCompleted ? Colors.green : Colors.grey,
        ),
        subtitle: Text(isCompleted ? 'Completed' : 'Pending', 
          style: TextStyle(color: isCompleted ? Colors.green : Colors.orange)),
        onTap: onTap,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    final pInfo = _isPersonalInfoCompleted();
    final pDocs = _isPersonalDocsCompleted();
    final vInfo = _isVehicleDetailsCompleted();
    final vDocs = _isVehicleDocsCompleted();

    final allCompleted = pInfo && pDocs && vInfo && vDocs;

    return Scaffold(
      appBar: AppBar(title: const Text('Verification Dashboard')),
      body: RefreshIndicator(
        onRefresh: _fetchData,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildStep('1. Personal Information', pInfo, () async {
              await Navigator.push(context, MaterialPageRoute(builder: (_) => PersonalInfoScreen(token: widget.token, data: _driverData)));
              _fetchData();
            }),
            _buildStep('2. Personal Documents', pDocs, () async {
              if (!pInfo) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please complete Personal Information first')));
                return;
              }
              await Navigator.push(context, MaterialPageRoute(builder: (_) => PersonalDocumentsScreen(token: widget.token, data: _driverData)));
              _fetchData();
            }),
            _buildStep('3. Vehicle Details', vInfo, () async {
              if (!pDocs) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please complete Personal Documents first')));
                return;
              }
              await Navigator.push(context, MaterialPageRoute(builder: (_) => VehicleDetailsScreen(token: widget.token, existingVehicles: _vehicles)));
              _fetchData();
            }),
            _buildStep('4. Vehicle Documents', vDocs, () async {
              if (!vInfo) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please add Vehicle Details first')));
                return;
              }
              await Navigator.push(context, MaterialPageRoute(builder: (_) => VehicleDocumentsScreen(token: widget.token, vehicle: _vehicles.first)));
              // Refresh data after returning from vehicle documents screen to update completion status
              await _fetchData();
            }),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: allCompleted ? () => _submitKYC() : null,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              child: _loading 
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Submit All for Review'),
            ),
            const SizedBox(height: 16),
            TextButton.icon(
              onPressed: () {
                // Call admin logic - can be implemented with url_launcher
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Contact admin support for assistance')),
                );
              },
              icon: const Icon(Icons.call),
              label: const Text('Call Admin'),
            )
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Personal Information Screen
// ---------------------------------------------------------------------------
class PersonalInfoScreen extends StatefulWidget {
  final String token;
  final Map<String, dynamic>? data;
  const PersonalInfoScreen({super.key, required this.token, this.data});

  @override
  State<PersonalInfoScreen> createState() => _PersonalInfoScreenState();
}

class _PersonalInfoScreenState extends State<PersonalInfoScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameCtrl;
  late TextEditingController _dobCtrl;
  late TextEditingController _stateCtrl;
  late TextEditingController _cityCtrl;
  late TextEditingController _pinCtrl;
  late TextEditingController _addrCtrl;
  String _gender = 'Male';
  bool _loading = false;
  late ApiClient _api;

  @override
  void initState() {
    super.initState();
    _api = ApiClient(baseUrl: kApiBaseUrl);
    final d = widget.data ?? {};
    _nameCtrl = TextEditingController(text: d['name']);
    _dobCtrl = TextEditingController(text: _formatDate(d['dateOfBirth']));
    _stateCtrl = TextEditingController(text: d['state']);
    _cityCtrl = TextEditingController(text: d['city']);
    _pinCtrl = TextEditingController(text: d['pinCode']);
    _addrCtrl = TextEditingController(text: d['address']);
    if (d['gender'] != null && d['gender'].isNotEmpty) _gender = d['gender'];
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      return dateStr.split('T')[0];
    } catch (e) {
      return dateStr;
    }
  }

  Future<void> _selectDate(TextEditingController ctrl) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(1990),
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        ctrl.text = "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final res = await _api.updatePersonalInfo(token: widget.token, data: {
        'name': _nameCtrl.text,
        'dateOfBirth': _dobCtrl.text,
        'gender': _gender,
        'state': _stateCtrl.text,
        'city': _cityCtrl.text,
        'pinCode': _pinCtrl.text,
        'address': _addrCtrl.text,
      });
      if (res.success) {
        if (mounted) Navigator.pop(context);
      } else {
        throw Exception(res.body['message']);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Personal Information')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Full Name'), validator: (v) => v!.isEmpty ? 'Required' : null),
            TextFormField(
              controller: _dobCtrl, 
              decoration: const InputDecoration(labelText: 'Date of Birth (YYYY-MM-DD)'),
              readOnly: true,
              onTap: () => _selectDate(_dobCtrl),
              validator: (v) => v!.isEmpty ? 'Required' : null
            ),
            DropdownButtonFormField<String>(
              initialValue: _gender,
              items: ['Male', 'Female', 'Other'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
              onChanged: (v) => setState(() => _gender = v!),
              decoration: const InputDecoration(labelText: 'Gender'),
            ),
            TextFormField(controller: _stateCtrl, decoration: const InputDecoration(labelText: 'State'), validator: (v) => v!.isEmpty ? 'Required' : null),
            TextFormField(controller: _cityCtrl, decoration: const InputDecoration(labelText: 'City'), validator: (v) => v!.isEmpty ? 'Required' : null),
            TextFormField(controller: _pinCtrl, decoration: const InputDecoration(labelText: 'Pin Code'), keyboardType: TextInputType.number, validator: (v) => v!.isEmpty ? 'Required' : null),
            TextFormField(controller: _addrCtrl, decoration: const InputDecoration(labelText: 'Address'), maxLines: 3, validator: (v) => v!.isEmpty ? 'Required' : null),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: _loading ? const CircularProgressIndicator() : const Text('Next'),
            )
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 4. Personal Documents Screen
// ---------------------------------------------------------------------------
class PersonalDocumentsScreen extends StatefulWidget {
  final String token;
  final Map<String, dynamic>? data;
  const PersonalDocumentsScreen({super.key, required this.token, this.data});

  @override
  State<PersonalDocumentsScreen> createState() => _PersonalDocumentsScreenState();
}

class _PersonalDocumentsScreenState extends State<PersonalDocumentsScreen> {
  final _formKey = GlobalKey<FormState>();
  late ApiClient _api;
  final _picker = ImagePicker();
  bool _loading = false;

  String? _panUrl;
  String? _dlFrontUrl;
  String? _dlBackUrl;
  String? _photoUrl;
  late TextEditingController _dlExpiryCtrl;

  @override
  void initState() {
    super.initState();
    _api = ApiClient(baseUrl: kApiBaseUrl);
    // Backend stores documents directly on driver object with field names: panCardImage, licenseImageFront, licenseImageBack, driverImageUrl
    // Check for backend field names (primary) and Flutter field names (fallback for backward compatibility)
    _panUrl = widget.data?['panCardImage'] ?? widget.data?['panCard'];
    _dlFrontUrl = widget.data?['licenseImageFront'] ?? widget.data?['dlFront'];
    _dlBackUrl = widget.data?['licenseImageBack'] ?? widget.data?['dlBack'];
    _photoUrl = widget.data?['driverImageUrl'] ?? widget.data?['driverCurrentPhoto'];
    _dlExpiryCtrl = TextEditingController(text: widget.data?['licenseValidity'] ?? widget.data?['dlExpiry'] ?? '');
    
    debugPrint('[PersonalDocuments] Initialized with driver data:');
    debugPrint('[PersonalDocuments] - panCardImage: ${widget.data?['panCardImage']}');
    debugPrint('[PersonalDocuments] - panCard: ${widget.data?['panCard']}');
    debugPrint('[PersonalDocuments] - licenseImageFront: ${widget.data?['licenseImageFront']}');
    debugPrint('[PersonalDocuments] - dlFront: ${widget.data?['dlFront']}');
    debugPrint('[PersonalDocuments] - licenseImageBack: ${widget.data?['licenseImageBack']}');
    debugPrint('[PersonalDocuments] - dlBack: ${widget.data?['dlBack']}');
    debugPrint('[PersonalDocuments] - driverImageUrl: ${widget.data?['driverImageUrl']}');
    debugPrint('[PersonalDocuments] - driverCurrentPhoto: ${widget.data?['driverCurrentPhoto']}');
    debugPrint('[PersonalDocuments] Final URLs:');
    debugPrint('[PersonalDocuments] - PAN: $_panUrl');
    debugPrint('[PersonalDocuments] - DL Front: $_dlFrontUrl');
    debugPrint('[PersonalDocuments] - DL Back: $_dlBackUrl');
    debugPrint('[PersonalDocuments] - Photo: $_photoUrl');
  }

  Future<void> _upload(String type, Function(String) onUrl) async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image == null) return;
    setState(() => _loading = true);
    try {
      final res = await _api.uploadImage(token: widget.token, filePath: image.path, type: type);
      debugPrint('[PersonalDocuments] Upload response: success=${res.success}, statusCode=${res.statusCode}');
      debugPrint('[PersonalDocuments] res.data type: ${res.data.runtimeType}');
      debugPrint('[PersonalDocuments] res.data: $res.data');
      debugPrint('[PersonalDocuments] res.body type: ${res.body.runtimeType}');
      debugPrint('[PersonalDocuments] res.body: $res.body');
      
      if (res.success) {
        // Backend returns: { success: true, message: "...", data: "https://..." }
        // res.data is the entire response object, so we need res.data['data']
        String? imageUrl;
        
        if (res.data is Map) {
          // Try to get URL from response data
          final dataMap = res.data as Map;
          imageUrl = dataMap['data']?.toString() ?? dataMap['url']?.toString();
          debugPrint('[PersonalDocuments] Extracted URL from res.data: $imageUrl');
        } else if (res.data is String) {
          // If data is directly a string (unlikely but handle it)
          imageUrl = res.data as String;
          debugPrint('[PersonalDocuments] res.data is String: $imageUrl');
        }
        
        // Fallback to res.body
        if ((imageUrl == null || imageUrl.isEmpty) && res.body is Map) {
          imageUrl = res.body['data']?.toString();
          debugPrint('[PersonalDocuments] Extracted URL from res.body: $imageUrl');
        }
        
        if (imageUrl == null || imageUrl.isEmpty) {
          debugPrint('[PersonalDocuments] ❌ Failed to extract URL. res.data: $res.data, res.body: $res.body');
          throw Exception('Failed to get image URL from response. Please try again.');
        }
        
        debugPrint('[PersonalDocuments] ✅ Final image URL: $imageUrl');
        setState(() => onUrl(imageUrl!));
      } else {
        final errorMsg = res.body is Map ? (res.body['message'] ?? res.message) : res.message;
        debugPrint('[PersonalDocuments] ❌ Upload failed: $errorMsg');
        throw Exception(errorMsg);
      }
    } catch (e, stackTrace) {
      debugPrint('[PersonalDocuments] ❌ Exception during upload: $e');
      debugPrint('[PersonalDocuments] Stack trace: $stackTrace');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Upload failed: ${e.toString().replaceAll('Exception: ', '')}'),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _selectDate(TextEditingController ctrl) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 365)),
      firstDate: DateTime.now(),
      lastDate: DateTime(2050),
    );
    if (picked != null) {
      setState(() {
        ctrl.text = "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_panUrl == null || _dlFrontUrl == null || _dlBackUrl == null || _photoUrl == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please upload all documents')));
      return;
    }
    setState(() => _loading = true);
    try {
      debugPrint('[PersonalDocuments] Submitting documents...');
      debugPrint('[PersonalDocuments] PAN URL: $_panUrl');
      debugPrint('[PersonalDocuments] DL Front URL: $_dlFrontUrl');
      debugPrint('[PersonalDocuments] DL Back URL: $_dlBackUrl');
      debugPrint('[PersonalDocuments] Photo URL: $_photoUrl');
      
      final res = await _api.updatePersonalDocuments(token: widget.token, data: {
        'panCard': _panUrl,
        'dlFront': _dlFrontUrl,
        'dlBack': _dlBackUrl,
        'dlExpiry': _dlExpiryCtrl.text,
        'driverCurrentPhoto': _photoUrl,
      });
      
      debugPrint('[PersonalDocuments] Submit response: success=${res.success}, statusCode=${res.statusCode}');
      debugPrint('[PersonalDocuments] Submit response body: ${res.body}');
      
      if (res.success) {
        if (mounted) Navigator.pop(context);
      } else {
        final errorMsg = res.body is Map ? (res.body['message'] ?? res.message) : res.message;
        debugPrint('[PersonalDocuments] ❌ Submit failed: $errorMsg');
        throw Exception(errorMsg);
      }
    } catch (e, stackTrace) {
      debugPrint('[PersonalDocuments] ❌ Exception during submit: $e');
      debugPrint('[PersonalDocuments] Stack trace: $stackTrace');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _buildUploadBtn(String label, String? url, VoidCallback onTap) {
    final hasImage = url != null && url.isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(width: 8),
            if (hasImage) const Icon(Icons.check_circle, color: Colors.green, size: 18),
          ],
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: _loading ? null : onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            height: 140,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              border: Border.all(color: hasImage ? Colors.green : Colors.grey.shade300, width: hasImage ? 2 : 1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: hasImage 
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(11),
                  child: Builder(
                    builder: (context) {
                      final imageUrl = transformImageUrl(url);
                      debugPrint('[PersonalDocuments] Loading image for "$label"');
                      debugPrint('[PersonalDocuments] Original URL: $url');
                      debugPrint('[PersonalDocuments] Transformed URL: $imageUrl');
                      return Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        headers: {
                          'Accept': 'image/*',
                        },
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) {
                            debugPrint('[PersonalDocuments] ✅ Image loaded successfully: $imageUrl');
                            return child;
                          }
                          return Center(
                            child: CircularProgressIndicator(
                              value: loadingProgress.expectedTotalBytes != null
                                  ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                  : null,
                            ),
                          );
                        },
                        errorBuilder: (context, error, stackTrace) {
                          debugPrint('[PersonalDocuments] ❌ Image load failed for "$label"');
                          debugPrint('[PersonalDocuments] URL: $imageUrl');
                          debugPrint('[PersonalDocuments] Error: $error');
                          debugPrint('[PersonalDocuments] Error type: ${error.runtimeType}');
                          debugPrint('[PersonalDocuments] StackTrace: $stackTrace');
                          return Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.broken_image, size: 40, color: Colors.red),
                              const SizedBox(height: 4),
                              Text('Failed to load', style: TextStyle(color: Colors.red.shade700, fontSize: 12)),
                            ],
                          );
                        },
                      );
                    },
                  ),
                )
              : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add_a_photo, size: 40, color: Colors.grey.shade500),
                    const SizedBox(height: 8),
                    Text('Tap to upload', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                  ],
                ),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final allUploaded = _panUrl != null && _dlFrontUrl != null && _dlBackUrl != null && _photoUrl != null;
    
    return Scaffold(
      appBar: AppBar(title: const Text('Personal Documents')),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_loading)
                    const LinearProgressIndicator(),
                  const SizedBox(height: 8),
                  _buildUploadBtn('PAN Card *', _panUrl, () => _upload('pan', (u) => _panUrl = u)),
                  _buildUploadBtn('Driving License (Front) *', _dlFrontUrl, () => _upload('dl_front', (u) => _dlFrontUrl = u)),
                  _buildUploadBtn('Driving License (Back) *', _dlBackUrl, () => _upload('dl_back', (u) => _dlBackUrl = u)),
                  TextFormField(
                    controller: _dlExpiryCtrl,
                    decoration: const InputDecoration(
                      labelText: 'DL Expiry Date *',
                      prefixIcon: Icon(Icons.calendar_today),
                      border: OutlineInputBorder(),
                    ),
                    readOnly: true,
                    onTap: () => _selectDate(_dlExpiryCtrl),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  _buildUploadBtn('Driver Current Photo *', _photoUrl, () => _upload('photo', (u) => _photoUrl = u)),
                  const SizedBox(height: 16),
                ],
              ),
            ),
            // Fixed bottom button
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 10,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: SafeArea(
                child: SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: (_loading || !allUploaded || _dlExpiryCtrl.text.isEmpty) ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _loading 
                      ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Next', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 5. Vehicle Details Screen
// ---------------------------------------------------------------------------
class VehicleDetailsScreen extends StatefulWidget {
  final String token;
  final List<dynamic> existingVehicles;
  const VehicleDetailsScreen({super.key, required this.token, required this.existingVehicles});

  @override
  State<VehicleDetailsScreen> createState() => _VehicleDetailsScreenState();
}

class _VehicleDetailsScreenState extends State<VehicleDetailsScreen> {
  final _formKey = GlobalKey<FormState>();
  late ApiClient _api;
  bool _loading = false;
  
  late TextEditingController _modelCtrl;
  late TextEditingController _plateCtrl;
  String? _selectedType;
  List<dynamic> _vehicleTypes = [];

  @override
  void initState() {
    super.initState();
    _api = ApiClient(baseUrl: kApiBaseUrl);
    if (widget.existingVehicles.isNotEmpty) {
      final v = widget.existingVehicles.first;
      _modelCtrl = TextEditingController(text: v['model']?.toString() ?? '');
      _plateCtrl = TextEditingController(text: v['licensePlate']?.toString() ?? v['license_plate']?.toString() ?? '');
      // Backend uses vTypeId for vehicle types, but vehicles might store vehicleTypeId
      _selectedType = v['vehicleTypeId']?.toString() ?? 
                     v['vehicle_type_id']?.toString() ?? 
                     v['vTypeId']?.toString() ??
                     v['v_type_id']?.toString() ??
                     v['typeId']?.toString();
    } else {
      _modelCtrl = TextEditingController();
      _plateCtrl = TextEditingController();
    }
    _fetchTypes();
  }

  Future<void> _fetchTypes() async {
    try {
      final res = await _api.getVehicleTypes(token: widget.token);
      debugPrint('[VehicleDetails] Fetching vehicle types...');
      debugPrint('[VehicleDetails] Response success: ${res.success}');
      debugPrint('[VehicleDetails] Response body: ${res.body}');
      debugPrint('[VehicleDetails] Response data: ${res.data}');
      
      if (res.success) {
        // Try multiple possible data locations
        dynamic typeData = res.body['data'] ?? res.body['types'] ?? res.body['vehicleTypes'] ?? res.data;
        
        debugPrint('[VehicleDetails] Type data: $typeData');
        debugPrint('[VehicleDetails] Type data type: ${typeData.runtimeType}');
        
        setState(() {
          if (typeData is List) {
            _vehicleTypes = typeData;
            debugPrint('[VehicleDetails] Loaded ${_vehicleTypes.length} vehicle types');
            if (_vehicleTypes.isNotEmpty) {
              debugPrint('[VehicleDetails] First type: ${_vehicleTypes.first}');
            }
          } else if (typeData is Map && typeData['data'] is List) {
            _vehicleTypes = typeData['data'] as List;
            debugPrint('[VehicleDetails] Loaded ${_vehicleTypes.length} vehicle types from nested data');
          } else {
            _vehicleTypes = [];
            debugPrint('[VehicleDetails] No vehicle types found, setting empty list');
          }
        });
      } else {
        debugPrint('[VehicleDetails] ❌ Failed to fetch vehicle types: ${res.message}');
      }
    } catch (e, stackTrace) {
      debugPrint('[VehicleDetails] ❌ Exception fetching vehicle types: $e');
      debugPrint('[VehicleDetails] StackTrace: $stackTrace: $stackTrace');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading vehicle types: $e')),
        );
      }
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final data = {
        'vehicleType': _selectedType, // Backend expects vehicleType (vTypeId), not vehicleTypeId
        'vehicleName': _modelCtrl.text, // Backend expects vehicleName, not model
        'vehicleNumber': _plateCtrl.text, // Backend expects vehicleNumber, not licensePlate
        'vehicleYear': 2023, // Optional
        'fuelType': 'Petrol', // Optional, default
      };
      
      debugPrint('[VehicleDetails] Submitting vehicle data: $data');

      ApiResult res;
      if (widget.existingVehicles.isNotEmpty) {
        final vId = widget.existingVehicles.first['vehicleId'] ?? widget.existingVehicles.first['vehicle_id'];
        // Include vehicleId in data map
        final updatedData = Map<String, dynamic>.from(data);
        if (vId != null && vId.toString().isNotEmpty) {
          updatedData['vehicleId'] = vId.toString();
        }
        res = await _api.updateVehicle(token: widget.token, data: updatedData);
      } else {
        res = await _api.addVehicle(token: widget.token, data: data);
      }

      if (res.success) {
        if (mounted) Navigator.pop(context);
      } else {
        throw Exception(res.body['message']);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Vehicle Details')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(controller: _modelCtrl, decoration: const InputDecoration(labelText: 'Vehicle Model'), validator: (v) => v!.isEmpty ? 'Required' : null),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedType,
              items: _vehicleTypes.isEmpty
                  ? [
                      const DropdownMenuItem<String>(
                        value: null,
                        child: Text('Loading vehicle types...', style: TextStyle(color: Colors.grey)),
                        enabled: false,
                      )
                    ]
                  : _vehicleTypes.map((e) {
                      // Backend uses vTypeId (not typeId)
                      final typeId = e['vTypeId']?.toString() ?? 
                                   e['v_type_id']?.toString() ??
                                   e['typeId']?.toString() ?? 
                                   e['type_id']?.toString() ?? 
                                   e['id']?.toString() ??
                                   e['vehicleTypeId']?.toString();
                      final name = e['name']?.toString() ?? 
                                 e['typeName']?.toString() ?? 
                                 e['vehicleType']?.toString() ??
                                 'Unknown';
                      debugPrint('[VehicleDetails] Processing type: id=$typeId, name=$name');
                      if (typeId == null || typeId.isEmpty) {
                        debugPrint('[VehicleDetails] ⚠️ Skipping type with null/empty ID: $e');
                        return null;
                      }
                      return DropdownMenuItem<String>(
                        value: typeId,
                        child: Text(name),
                      );
                    }).whereType<DropdownMenuItem<String>>().toList(),
              onChanged: _vehicleTypes.isEmpty 
                  ? null 
                  : (v) {
                      debugPrint('[VehicleDetails] Selected vehicle type: $v');
                      setState(() => _selectedType = v);
                    },
              decoration: const InputDecoration(
                labelText: 'Vehicle Type',
                hintText: 'Select vehicle type',
              ),
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(controller: _plateCtrl, decoration: const InputDecoration(labelText: 'License Plate'), validator: (v) => v!.isEmpty ? 'Required' : null),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: _loading ? const CircularProgressIndicator() : const Text('Next'),
            )
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// 6. Vehicle Documents Screen
// ---------------------------------------------------------------------------
class VehicleDocumentsScreen extends StatefulWidget {
  final String token;
  final Map<String, dynamic> vehicle;
  const VehicleDocumentsScreen({super.key, required this.token, required this.vehicle});

  @override
  State<VehicleDocumentsScreen> createState() => _VehicleDocumentsScreenState();
}

class _VehicleDocumentsScreenState extends State<VehicleDocumentsScreen> {
  final _formKey = GlobalKey<FormState>();
  late ApiClient _api;
  final _picker = ImagePicker();
  bool _loading = false;

  String? _rcFront;
  String? _rcBack;
  String? _insurance;
  String? _pollution;
  
  late TextEditingController _rcExpiryCtrl;
  late TextEditingController _insExpiryCtrl;
  late TextEditingController _polExpiryCtrl;

  String get _vehicleId => widget.vehicle['vehicleId']?.toString() ?? '';

  @override
  void initState() {
    super.initState();
    _api = ApiClient(baseUrl: kApiBaseUrl);
    final docs = widget.vehicle['documents'] ?? {};
    _rcFront = docs['rcFront'];
    _rcBack = docs['rcBack'];
    _insurance = docs['insuranceDoc'];
    _pollution = docs['pollutionDoc'];
    
    _rcExpiryCtrl = TextEditingController(text: docs['rcExpiry']);
    _insExpiryCtrl = TextEditingController(text: docs['insuranceExpiry']);
    _polExpiryCtrl = TextEditingController(text: docs['pollutionExpiry']);
  }

  Future<void> _upload(String type, Function(String) onUrl) async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image == null) return;
    setState(() => _loading = true);
    try {
      // Pass vehicleId for vehicle documents to organize in proper folder
      final res = await _api.uploadImage(
        token: widget.token, 
        filePath: image.path, 
        type: type,
        vehicleId: _vehicleId,
      );
      debugPrint('[VehicleDocuments] Upload response: success=${res.success}, statusCode=${res.statusCode}');
      debugPrint('[VehicleDocuments] res.data type: ${res.data.runtimeType}');
      debugPrint('[VehicleDocuments] res.data: $res.data');
      debugPrint('[VehicleDocuments] res.body type: ${res.body.runtimeType}');
      debugPrint('[VehicleDocuments] res.body: $res.body');
      
      if (res.success) {
        // Backend returns: { success: true, message: "...", data: "https://..." }
        // res.data is the entire response object, so we need res.data['data']
        String? imageUrl;
        
        if (res.data is Map) {
          // Try to get URL from response data
          final dataMap = res.data as Map;
          imageUrl = dataMap['data']?.toString() ?? dataMap['url']?.toString();
          debugPrint('[VehicleDocuments] Extracted URL from res.data: $imageUrl');
        } else if (res.data is String) {
          // If data is directly a string (unlikely but handle it)
          imageUrl = res.data as String;
          debugPrint('[VehicleDocuments] res.data is String: $imageUrl');
        }
        
        // Fallback to res.body
        if ((imageUrl == null || imageUrl.isEmpty) && res.body is Map) {
          imageUrl = res.body['data']?.toString();
          debugPrint('[VehicleDocuments] Extracted URL from res.body: $imageUrl');
        }
        
        if (imageUrl == null || imageUrl.isEmpty) {
          debugPrint('[VehicleDocuments] ❌ Failed to extract URL. res.data: $res.data, res.body: $res.body');
          throw Exception('Failed to get image URL from response. Please try again.');
        }
        
        debugPrint('[VehicleDocuments] ✅ Final image URL: $imageUrl');
        setState(() => onUrl(imageUrl!));
      } else {
        final errorMsg = res.body is Map ? (res.body['message'] ?? res.message) : res.message;
        debugPrint('[VehicleDocuments] ❌ Upload failed: $errorMsg');
        throw Exception(errorMsg);
      }
    } catch (e, stackTrace) {
      debugPrint('[VehicleDocuments] ❌ Exception during upload: $e');
      debugPrint('[VehicleDocuments] Stack trace: $stackTrace');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Upload failed: ${e.toString().replaceAll('Exception: ', '')}'),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _selectDate(TextEditingController ctrl) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 365)),
      firstDate: DateTime.now(),
      lastDate: DateTime(2050),
    );
    if (picked != null) {
      setState(() {
        ctrl.text = "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_rcFront == null || _rcBack == null || _insurance == null || _pollution == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please upload all documents')));
      return;
    }
    setState(() => _loading = true);
    try {
      // Backend expects: rcBookImageFront, rcBookImageBack, insuranceImage, pollutionImage
      // Also: rcExpiryDate, insuranceExpiryDate, pollutionExpiryDate
      final res = await _api.updateVehicleDocuments(token: widget.token, vehicleId: widget.vehicle['vehicleId'], data: {
        'rcBookImageFront': _rcFront,
        'rcBookImageBack': _rcBack,
        'rcExpiryDate': _rcExpiryCtrl.text,
        'insuranceImage': _insurance,
        'insuranceExpiryDate': _insExpiryCtrl.text,
        'pollutionImage': _pollution,
        'pollutionExpiryDate': _polExpiryCtrl.text,
      });
      if (res.success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Vehicle documents uploaded successfully!'), backgroundColor: Colors.green),
          );
          Navigator.pop(context);
        }
      } else {
        throw Exception(res.body['message']);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _buildUploadBtn(String label, String? url, VoidCallback onTap) {
    final hasImage = url != null && url.isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(width: 8),
            if (hasImage) const Icon(Icons.check_circle, color: Colors.green, size: 18),
          ],
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: _loading ? null : onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            height: 140,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              border: Border.all(color: hasImage ? Colors.green : Colors.grey.shade300, width: hasImage ? 2 : 1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: hasImage 
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(11),
                  child: Builder(
                    builder: (context) {
                      final imageUrl = transformImageUrl(url);
                      debugPrint('[PersonalDocuments] Loading image for "$label"');
                      debugPrint('[PersonalDocuments] Original URL: $url');
                      debugPrint('[PersonalDocuments] Transformed URL: $imageUrl');
                      return Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        headers: {
                          'Accept': 'image/*',
                        },
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) {
                            debugPrint('[PersonalDocuments] ✅ Image loaded successfully: $imageUrl');
                            return child;
                          }
                          return Center(
                            child: CircularProgressIndicator(
                              value: loadingProgress.expectedTotalBytes != null
                                  ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                  : null,
                            ),
                          );
                        },
                        errorBuilder: (context, error, stackTrace) {
                          debugPrint('[PersonalDocuments] ❌ Image load failed for "$label"');
                          debugPrint('[PersonalDocuments] URL: $imageUrl');
                          debugPrint('[PersonalDocuments] Error: $error');
                          debugPrint('[PersonalDocuments] Error type: ${error.runtimeType}');
                          debugPrint('[PersonalDocuments] StackTrace: $stackTrace');
                          return Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.broken_image, size: 40, color: Colors.red),
                              const SizedBox(height: 4),
                              Text('Failed to load', style: TextStyle(color: Colors.red.shade700, fontSize: 12)),
                            ],
                          );
                        },
                      );
                    },
                  ),
                )
              : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add_a_photo, size: 40, color: Colors.grey.shade500),
                    const SizedBox(height: 8),
                    Text('Tap to upload', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                  ],
                ),
          ),
        ),
        const SizedBox(height: 12),
      ],
    );
  }

  Widget _buildDateField(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        decoration: InputDecoration(
          labelText: '$label *',
          prefixIcon: const Icon(Icons.calendar_today),
          border: const OutlineInputBorder(),
        ),
        readOnly: true,
        onTap: () => _selectDate(controller),
        validator: (v) => v!.isEmpty ? 'Required' : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final allUploaded = _rcFront != null && _rcBack != null && _insurance != null && _pollution != null;
    final allDates = _rcExpiryCtrl.text.isNotEmpty && _insExpiryCtrl.text.isNotEmpty && _polExpiryCtrl.text.isNotEmpty;
    
    return Scaffold(
      appBar: AppBar(title: const Text('Vehicle Documents')),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_loading)
                    const LinearProgressIndicator(),
                  const SizedBox(height: 8),
                  _buildUploadBtn('RC Book Front *', _rcFront, () => _upload('rc_front', (u) => _rcFront = u)),
                  _buildUploadBtn('RC Book Back *', _rcBack, () => _upload('rc_back', (u) => _rcBack = u)),
                  _buildDateField('RC Expiry Date', _rcExpiryCtrl),
                  _buildUploadBtn('Insurance Document *', _insurance, () => _upload('insurance', (u) => _insurance = u)),
                  _buildDateField('Insurance Expiry Date', _insExpiryCtrl),
                  _buildUploadBtn('Pollution Certificate *', _pollution, () => _upload('pollution', (u) => _pollution = u)),
                  _buildDateField('Pollution Expiry Date', _polExpiryCtrl),
                  const SizedBox(height: 16),
                ],
              ),
            ),
            // Fixed bottom button
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 10,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: SafeArea(
                child: SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _loading ? null : () {
                      if (!allUploaded) {
                         ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please upload all documents (RC Front, Back, Insurance, Pollution)')));
                         return;
                      }
                      if (!allDates) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select all expiry dates')));
                        return;
                      }
                      _submit();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _loading 
                      ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Save & Finish', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

