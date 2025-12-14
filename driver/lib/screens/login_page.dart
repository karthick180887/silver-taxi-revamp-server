import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../api_client.dart';
import '../services/storage_service.dart';
import '../services/fcm_service.dart';
import '../services/permission_service.dart';
import 'main_screen.dart';
import 'waiting_page.dart';
import '../kyc_screens.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _phoneController = TextEditingController(text: '9944226010');
  final String _defaultName = 'Driver Tester';
  final String _defaultEmail = 'driver@test.com';
  final _otpController = TextEditingController();

  bool _loading = false;
  String? _otpHint;
  bool _useLoginFlow = true;
  String? _smsToken;
  String? _driverId;

  final _api = ApiClient(baseUrl: kApiBaseUrl);

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  String _cleanPhone() {
    final digits = _phoneController.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.startsWith('91') && digits.length > 10) {
      return digits.substring(2);
    }
    return digits;
  }

  Future<void> _requestOtp() async {
    setState(() {
      _loading = true;
      _otpHint = null;
    });
    try {
      final phone = _cleanPhone();

      try {
        final loginRes = await _api.sendLoginOtp(phone: phone);
        
        if (loginRes.statusCode == 404) {
          throw Exception('Driver not found');
        }

        if (!loginRes.success) {
          throw Exception(loginRes.message.isNotEmpty 
              ? loginRes.message 
              : 'Failed to send OTP');
        }

        final loginData = loginRes.body;
        final loginOtp = loginData['otp']?.toString();
        _smsToken = loginData['smsToken']?.toString();
        _driverId = loginData['driverId']?.toString();
        
        debugPrint('Login OTP Response: $loginData');
        
        if (loginOtp != null && loginOtp.isNotEmpty) {
          _otpController.text = loginOtp;
          _otpHint = 'OTP (for testing): $loginOtp';
        }
        _useLoginFlow = true;
      } catch (e) {
        final errorMsg = e.toString().toLowerCase();
        if (errorMsg.contains('404') || errorMsg.contains('not found')) {
          _otpController.clear();
          
          final signupRes = await _api.sendSignupOtp(
            phone: phone,
            name: _defaultName,
            email: _defaultEmail,
          );
          
          final data = signupRes.body;
          final otp = data['otp']?.toString();
          _smsToken = data['smsToken']?.toString();
          _driverId = data['driverId']?.toString();
          
          debugPrint('Signup OTP Response: $data');
          
          if (otp != null && otp.isNotEmpty) {
            _otpController.text = otp;
            _otpHint = 'OTP (for testing): $otp';
          }
          _useLoginFlow = false;
        } else {
          rethrow;
        }
      }
    } catch (e) {
      _showError(e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verifyOtp() async {
    setState(() => _loading = true);
    try {
      final phone = _cleanPhone();
      final otpVal = _otpController.text.trim();

      ApiResult result;
      if (_useLoginFlow) {
        if (_smsToken == null) {
          throw Exception('SMS token not found. Please request OTP again.');
        }
        result = await _api.verifyLoginOtp(
          phone: phone,
          otp: otpVal,
          smsToken: _smsToken!,
          driverId: _driverId,
        );
        if (!result.success) {
          throw Exception(result.body['message'] ?? 'Login failed');
        }
      } else {
        if (_smsToken == null) {
          throw Exception('SMS token not found. Please request OTP again.');
        }
        String? fcmToken;
        try {
          fcmToken = await FcmService().getToken();
        } catch (e) {
          debugPrint('Error getting FCM token: $e');
          fcmToken = '';
        }
        
        result = await _api.verifySignupOtp(
          phone: phone,
          otp: otpVal,
          smsToken: _smsToken!,
          fcmToken: fcmToken ?? '',
          name: _defaultName,
          email: _defaultEmail,
        );

        final msg = (result.body['message'] ?? '').toString().toLowerCase();
        if (!result.success && msg.contains('already exists')) {
          _useLoginFlow = true;
          final loginRes = await _api.sendLoginOtp(phone: phone);
          if (loginRes.statusCode == 404) {
            throw Exception('Driver not found');
          }
          final loginData = loginRes.body;
          _smsToken = loginData['smsToken']?.toString();
          _driverId = loginData['driverId']?.toString();
          
          if (_smsToken == null) {
            throw Exception('SMS token not found. Please request OTP again.');
          }
          result = await _api.verifyLoginOtp(
            phone: phone,
            otp: otpVal,
            smsToken: _smsToken!,
            driverId: _driverId,
          );
          if (!result.success) {
            throw Exception(result.body['message'] ?? 'Login failed');
          }
        } else if (!result.success) {
          throw Exception(result.body['message'] ?? 'Signup failed');
        }
      }

      final responseBody = result.body;
      final data = responseBody['data'] as Map<String, dynamic>? ?? {};
      final token = data['token'] as String? ?? data['accessToken'] as String?;

      if (token != null && mounted) {
        final driver = (data['driver'] as Map<String, dynamic>?) ?? {};
        final driverId = driver['driverId']?.toString() ?? 'unknown';
        final refreshToken = data['refreshToken'] as String?;
        
        await StorageService.saveToken(token);
        if (refreshToken != null) {
          await StorageService.saveRefreshToken(refreshToken);
        }
        await StorageService.saveDriverId(driverId);
        await StorageService.saveDriverData(driver);
        await StorageService.savePhone(_phoneController.text.trim());
        
        final adminVerifiedRaw = driver['adminVerified']?.toString() ?? '';
        final adminVerified = adminVerifiedRaw.toLowerCase();
        final documentVerified = driver['documentVerified']?.toString().toLowerCase() ?? '';
        final profileVerified = driver['profileVerified']?.toString().toLowerCase() ?? '';
        
        final isApproved = adminVerified == 'approved' || 
                          adminVerifiedRaw == 'Approved' ||
                          (adminVerified.isEmpty && documentVerified == 'accepted' && profileVerified == 'accepted');
        
        if (isApproved) {
          await _requestPermissions(context);
          
          try {
            final fcmToken = await FcmService().getToken();
            if (fcmToken != null) {
              _api.updateFCMToken(token: token, fcmToken: fcmToken).then((_) {});
            }
          } catch (_) {}

          if (mounted) {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(
                builder: (_) => MainScreen(token: token, driverId: driverId),
              ),
              (route) => false,
            );
          }
        } else if (adminVerified == 'rejected') {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => const WaitingPage(
                title: 'Account Rejected',
                message: 'Your account has been rejected. Please contact support.',
              ),
            ),
          );
        } else {
          if (documentVerified == 'accepted' || profileVerified == 'accepted') {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => const WaitingPage(
                  title: 'Under Review',
                  message: 'Your documents have been submitted and are under admin review.\n\nYou will be notified once approved.',
                ),
              ),
            );
          } else {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => WelcomeScreen(token: token),
              ),
            );
          }
        }
      } else if (token == null) {
        throw Exception(result.body['message'] ?? 'Token missing');
      }
    } catch (e) {
      _showError(e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _requestPermissions(BuildContext context) async {
    try {
      final messenger = ScaffoldMessenger.maybeOf(context);
      final permissionService = PermissionService();
      final results = await permissionService.requestPermissionsWithDialog(context);
      
      if (!mounted || messenger == null) return;

      final missing = <String>[];
      if (!results['location']!) missing.add('Location');
      if (!results['overlay']!) missing.add('Overlay');
      
      if (missing.isNotEmpty) {
        messenger.showSnackBar(
          SnackBar(
            content: Text('Some permissions are missing: ${missing.join(", ")}.'),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } catch (_) {}
  }

  void _showError(Object e) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(e.toString().replaceAll('Exception: ', '')),
        backgroundColor: Colors.red.shade400,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Premium Theme Colors
    const kPrimaryBlue = Color(0xFF2563EB); // Royal Blue
    const kDarkText = Color(0xFF1E293B); // Slate 900
    
    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Column(
          children: [
            // 1. Hero / Brand Section with Gradient
            Container(
              height: MediaQuery.of(context).size.height * 0.45,
              width: double.infinity,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(40),
                  bottomRight: Radius.circular(40),
                ),
              ),
              child: SafeArea(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withOpacity(0.2)),
                      ),
                      child: const Icon(CupertinoIcons.car_detailed, size: 64, color: Colors.white),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'SILVER TAXI',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 2.0,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Driver Partner App',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.white.withOpacity(0.8),
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // 2. Login Form
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Welcome Back!',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: kDarkText,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Enter your mobile number to get started',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey.shade500),
                  ),
                  const SizedBox(height: 32),

                  // Phone Input
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: Row(
                      children: [
                        const Icon(CupertinoIcons.phone_fill, color: Colors.grey),
                        const SizedBox(width: 12),
                        const Text(
                          '+91',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: kDarkText,
                          ),
                        ),
                        Container(
                          margin: const EdgeInsets.symmetric(horizontal: 12),
                          height: 24,
                          width: 1,
                          color: Colors.grey.shade300,
                        ),
                        Expanded(
                          child: TextField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: kDarkText,
                            ),
                            decoration: InputDecoration(
                              hintText: 'Mobile Number',
                              hintStyle: TextStyle(color: Colors.grey.shade400),
                              border: InputBorder.none,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // OTP Input (Animated Visibility)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    height: _smsToken != null ? 80 : 0,
                    margin: EdgeInsets.only(top: _smsToken != null ? 16 : 0),
                    child: _smsToken != null 
                        ? Container(
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            alignment: Alignment.centerLeft,
                            child: Row(
                              children: [
                                const Icon(CupertinoIcons.lock_shield_fill, color: Colors.grey),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextField(
                                    controller: _otpController,
                                    keyboardType: TextInputType.number,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 4,
                                      color: kDarkText,
                                    ),
                                    decoration: InputDecoration(
                                      hintText: '• • • • • •',
                                      hintStyle: TextStyle(
                                        color: Colors.grey.shade400,
                                        letterSpacing: 4,
                                      ),
                                      border: InputBorder.none,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          )
                        : const SizedBox.shrink(),
                  ),

                  // Hint Text (Dev only)
                  if (_otpHint != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8, bottom: 8),
                      child: Text(
                        _otpHint!,
                        style: TextStyle(color: Colors.green.shade600, fontSize: 12, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                    ),

                  const SizedBox(height: 32),

                  // Action Button
                  SizedBox(
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _loading 
                          ? null 
                          : (_smsToken == null ? _requestOtp : _verifyOtp),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kPrimaryBlue,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: _loading
                          ? const SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : Text(
                              _smsToken == null ? 'Get OTP' : 'Verify & Login',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Footer
                  Text(
                    'Ensure valid insurance & license before driving.\nDrive safe!',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade400, height: 1.5),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
