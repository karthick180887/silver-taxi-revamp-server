import 'package:flutter/material.dart';
import 'package:sendotp_flutter_sdk/sendotp_flutter_sdk.dart';
import '../api_client.dart';
import '../design_system.dart';
import 'main_screen.dart';
import '../services/storage_service.dart';
import '../services/fcm_service.dart';
import '../services/permission_service.dart'; // Ensure this exists or remove if unused, keeping for safety

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _api = DriverApiClient(); // Using DriverApiClient from api_client.dart
  
  bool _isOtpSent = false;
  bool _isLoading = false;
  String? _errorMessage;
  String? _reqId; // Request ID from SDK

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // OTP Logic via SDK
  // ---------------------------------------------------------------------------

  Future<void> _requestOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.length != 10) {
      _handleError('Please enter a valid 10-digit number');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final phoneNumber = '91$phone'; // SDK expects country code
      final data = {'identifier': phoneNumber};
      
      debugPrint('Sending OTP via SDK to: $phoneNumber');
      final response = await OTPWidget.sendOTP(data);
      debugPrint('SDK Send Response: $response');

      // Check SDK response
      if (response != null && response['type'] == 'success') {
        setState(() {
          _reqId = response['message']; // Save reqId for verification
          _isOtpSent = true;
          _isLoading = false;
        });
      } else {
        _handleError(response?['message'] ?? 'Failed to send OTP. Please try again.');
      }
    } catch (e) {
      _handleError('An error occurred: $e');
    }
  }

  Future<void> _verifyOtp() async {
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      _handleError('Please enter a valid 6-digit OTP');
      return;
    }

    if (_reqId == null) {
      _handleError('Session expired. Please resend OTP.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // 1. Verify with SDK
      final verifyData = {
        'reqId': _reqId, 
        'otp': otp
      };

      debugPrint('Verifying OTP via SDK: $verifyData');
      final response = await OTPWidget.verifyOTP(verifyData);
      debugPrint('SDK Verify Response: $response');

      if (response != null && response['type'] == 'success') {
        // SDK Verification Success -> Get Access Token
        final accessToken = response['message']; // Token from SDK
        final phone = _phoneController.text.trim();
        String? fcmToken;
        try {
           fcmToken = await FcmService().getToken();
        } catch (_) {}

        // 2. Verify with Backend (Login)
        // We pass accessToken so backend can verify it with MSG91 Widget API
        final loginResult = await _api.verifyLoginOtp(
          phone: phone,
          accessToken: accessToken,
          otp: otp, // Pass for fallback/logging
          smsToken: 'sdk_token' // Dummy, as we use accessToken now
        );

        if (loginResult.success) {
          debugPrint('Login Verification Success. Body: ${loginResult.body}');
          final dynamic responseData = loginResult.body['data'];
          
          if (responseData != null && responseData is Map) {
             final Map<String, dynamic> safeData = Map<String, dynamic>.from(responseData);
             await _processSuccess(safeData);
          } else {
             _handleError('Login successful but data is invalid');
             debugPrint('Invalid Data Type: ${responseData?.runtimeType}');
          }
        } else if (loginResult.statusCode == 404) {
          // 3. User Not Found -> Signup Flow
          debugPrint('User not found (404), attempting signup...');
          final signupToken = loginResult.body['signupToken']; // Extract token from 404 response
          
          final signupResult = await _api.verifySignupOtp(
            phone: phone,
            accessToken: accessToken,
            otp: otp,
            smsToken: 'sdk_token',
            fcmToken: fcmToken ?? 'pending_fcm_token',
            name: 'New Driver', 
            email: 'driver_${DateTime.now().millisecondsSinceEpoch}@test.com',
            signupToken: signupToken, // Pass token
          );

          // Check BOTH HTTP success AND body.success field
          final bool bodySuccess = signupResult.body['success'] == true;
          
          if (signupResult.success && bodySuccess) {
            debugPrint('Signup Success. Body: ${signupResult.body}');
            final dynamic signupData = signupResult.body['data'];
            debugPrint('Signup Data Type: ${signupData?.runtimeType}, Value: $signupData');
            
            // Handle possible nested data structure
            Map<String, dynamic>? safeData;
            if (signupData != null && signupData is Map) {
                 safeData = Map<String, dynamic>.from(signupData);
            } else if (signupResult.body['driver'] != null) {
                 // Alternative: data might be at root level
                 safeData = Map<String, dynamic>.from(signupResult.body);
            }
            
            if (safeData != null) {
              await _processSuccess(safeData);
            } else {
                 _handleError('Signup successful but response format unexpected. Keys: ${signupResult.body.keys}');
                 debugPrint('Full Body: ${signupResult.body}');
            }
          } else {
             // Check if driver already exists - they should login instead
             final message = signupResult.body['message'] ?? 'Signup failed';
             if (message.toString().toLowerCase().contains('already exists')) {
               _handleError('This number is already registered. Please try logging in.');
             } else {
               _handleError(message);
             }
          }
        } else {
          _handleError(loginResult.body['message'] ?? 'Login failed');
        }

      } else {
        _handleError(response?['message'] ?? 'Invalid OTP');
      }
    } catch (e) {
      _handleError('An error occurred: $e');
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  void _handleError(String message) {
    if (mounted) {
      setState(() {
        _errorMessage = message;
        _isLoading = false;
      });
    }
  }

  Future<void> _processSuccess(Map<String, dynamic> data) async {
    final token = data['token'];
    final driver = data['driver'];
    final driverId = driver?['driverId'] ?? driver?['id'];

    if (token != null) {
      await StorageService.saveToken(token);
      if (driverId != null) {
        await StorageService.saveDriverId(driverId.toString());
      }
      try {
        await FcmService().syncTokenToBackendNow();
      } catch (_) {}
      // Save other driver data if needed
      
      // Request Permissions if needed
      if (mounted) {
         // Check verification status
         final adminVerified = (driver?['adminVerified'] ?? '').toString().toLowerCase();
         // Simple routing for now
         if (adminVerified == 'approved') {
            await _requestPermissions(context);
            if (mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => MainScreen(token: token, driverId: driverId?.toString() ?? ''))
                );
            }
         } else {
            // Send to Waiting Page or Main Screen with restricted access?
            // For now, let's send to Main Screen but standard flow might be WaitingPage.
            // Matching existing logic:
            Navigator.of(context).pushReplacement(
               MaterialPageRoute(builder: (_) => MainScreen(token: token, driverId: driverId?.toString() ?? ''))
            );
         }
      }
    } else {
      _handleError('Login successful but token missing');
    }
  }

  Future<void> _requestPermissions(BuildContext context) async {
    try {
      final permissionService = PermissionService();
      await permissionService.requestPermissionsWithDialog(context);
    } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // UI Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Stack(
        children: [
          // Background Elements
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                color: AppColors.accent.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            bottom: -50,
            left: -50,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                color: AppColors.secondary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 400),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Logo
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white.withOpacity(0.2)),
                        ),
                        child: const Icon(
                          Icons.local_taxi,
                          size: 64,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      Text(
                        'Driver Login',
                        style: AppTextStyles.h1.copyWith(color: Colors.white),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Welcome to Silver Taxi Driver App',
                        style: AppTextStyles.bodyLarge.copyWith(color: Colors.white70),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 48),

                      // Login Card
                      Card(
                        elevation: 8,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                _isOtpSent ? 'Verify OTP' : 'Login',
                                style: AppTextStyles.h2,
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 32),

                              if (!_isOtpSent)
                                TextField(
                                  controller: _phoneController,
                                  keyboardType: TextInputType.phone,
                                  style: AppTextStyles.bodyLarge,
                                  decoration: InputDecoration(
                                    labelText: 'Phone Number',
                                    hintText: '9876543210',
                                    prefixIcon: const Icon(Icons.phone_outlined),
                                    prefixText: '+91 ',
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                )
                              else
                                TextField(
                                  controller: _otpController,
                                  keyboardType: TextInputType.number,
                                  style: AppTextStyles.h3.copyWith(letterSpacing: 8),
                                  textAlign: TextAlign.center,
                                  maxLength: 6,
                                  decoration: InputDecoration(
                                    labelText: 'Enter OTP',
                                    hintText: '000000',
                                    counterText: '',
                                    prefixIcon: const Icon(Icons.lock_outline),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),

                              if (_errorMessage != null) ...[
                                const SizedBox(height: 16),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppColors.error.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: AppColors.error.withOpacity(0.3)),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.error_outline, size: 20, color: AppColors.error),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          _errorMessage!,
                                          style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],

                              const SizedBox(height: 32),
                              SizedBox(
                                height: 56,
                                child: ElevatedButton(
                                  onPressed: _isLoading
                                      ? null
                                      : (_isOtpSent ? _verifyOtp : _requestOtp),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  child: _isLoading
                                      ? const SizedBox(
                                          height: 24,
                                          width: 24,
                                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                        )
                                      : Text(
                                          _isOtpSent ? 'Verify & Login' : 'Send OTP',
                                          style: AppTextStyles.button,
                                        ),
                                ),
                              ),

                              if (_isOtpSent) ...[
                                const SizedBox(height: 16),
                                TextButton(
                                  onPressed: _isLoading ? null : () {
                                    setState(() {
                                      _isOtpSent = false;
                                      _otpController.clear();
                                      _errorMessage = null;
                                    });
                                  },
                                  child: const Text('Change Phone Number'),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
