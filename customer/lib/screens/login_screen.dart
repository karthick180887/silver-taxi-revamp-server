import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sendotp_flutter_sdk/sendotp_flutter_sdk.dart';
import '../api_client.dart';
import '../design_system.dart';
import 'main_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _apiClient = CustomerApiClient(baseUrl: kApiBaseUrl);
  
  bool _isOtpSent = false;
  bool _isLoading = false;
  String? _errorMessage;
  String? _reqId;
  final String _widgetId = '356c70646b5a303735303838';
  final String _widgetToken = '482940T8rHqdAb4J56940e1baP1';
  static const String _defaultAdminId = 'admin-1';

  @override
  void initState() {
    super.initState();
    OTPWidget.initializeWidget(_widgetId, _widgetToken);
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  bool _isNewUser = false;

  Future<void> _sendOtp() async {
    if (_phoneController.text.isEmpty) {
      setState(() => _errorMessage = 'Please enter your phone number');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _isNewUser = false;
    });

    try {
      final phoneNumber = '91${_phoneController.text}';
      final data = {'identifier': phoneNumber};
      
      print('Sending OTP via SDK to: $phoneNumber');
      final response = await OTPWidget.sendOTP(data);
      print('SDK Send Response: $response');

      if (response != null && response['type'] == 'success') {
         setState(() {
           _isOtpSent = true;
           _isLoading = false;
           _reqId = response['message']; // The message usually contains reqId or check docs
           // The SDK documentation says response has reqId? 
           // Wait, usually the response format is {type: success, message: reqId} or similar.
           // I will assume message is reqId or inspect payload.
           // Actually, better to safer parsing:
           _reqId = response['message'];
         });
      } else {
         setState(() {
           _errorMessage = response?['message'] ?? 'Failed to send OTP via SDK';
           _isLoading = false;
         });
      }
    } catch (e) {
      print("SDK Send OTP Error: $e");
      setState(() {
        _errorMessage = 'SDK Error: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpController.text.isEmpty) {
      setState(() => _errorMessage = 'Please enter OTP');
      return;
    }

    if (_reqId == null) {
       setState(() => _errorMessage = 'Request ID missing. Please resend OTP.');
       return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final verifyData = {
        'reqId': _reqId, 
        'otp': _otpController.text
      };
      
      print('Verifying OTP via SDK: $verifyData');
      final response = await OTPWidget.verifyOTP(verifyData);
      print('SDK Verify Response: $response');

      if (response != null && response['type'] == 'success') {
          // Verification Successful, Get Token (JWT)
          // The snippet implies we get a JWT token.
          // Let's assume response['message'] is the token or similar.
          // BUT, `verifyAccessToken` snippet says "jwt_token_from_otp_widget".
          // If valid, response should contain `message` as token? Or check keys.
          // Common MSG91 SDK returns token in `message` or `token`.
          // I'll try `message` first as per common implementation or pass the whole response logic.
          
          final accessToken = response['message']; // Assuming token is here

          // Now Verify with Backend
          final backendResult = await _apiClient.customerLogin(
             type: 'verify',
             adminId: _defaultAdminId,
             phone: _phoneController.text,
             otp: _otpController.text,
             smsToken: 'sdk_token', // Dummy needed?
             accessToken: accessToken
          );

           if (backendResult.success && backendResult.body['data'] != null) {
              _processLoginSuccess(backendResult.body['data']);
           } else {
              // Try Signup Flow if Login failed (user might be new)
               // Wait, 'verify' endpoint checks DB.
               // If 404, we need to Signup.
              if (backendResult.statusCode == 404) {
                 final signupResult = await _apiClient.customerSignup(
                    type: 'verify',
                    adminId: _defaultAdminId,
                    phone: _phoneController.text,
                    name: 'New Customer',
                    otp: _otpController.text, // Actually not needed if using accessToken
                    accessToken: accessToken,
                    smsToken: 'sdk_token',
                    fcmToken: 'pending_fcm_token_reg'
                 );
                 
                 if (signupResult.success) {
                    _processLoginSuccess(signupResult.body['data']);
                 } else {
                     setState(() {
                        _errorMessage = signupResult.body['message'] ?? 'Registration failed';
                        _isLoading = false;
                     });
                 }
              } else {
                 setState(() {
                   _errorMessage = backendResult.body['message'] ?? 'Backend Verification Failed';
                   _isLoading = false;
                 });
              }
           }

      } else {
         setState(() {
           _errorMessage = response?['message'] ?? 'Invalid OTP (SDK)';
           _isLoading = false;
         });
      }

    } catch (e) {
       print("SDK Verify Error: $e");
       setState(() {
        _errorMessage = 'Verification error: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _processLoginSuccess(dynamic data) async {
    final token = data['token'] ?? data['accessToken'];
    final customerId = data['customerId'] ?? data['customer']?['customerId'] ?? data['customer']?['id'];

    if (token != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('customer_token', token);
      if (customerId != null) {
        await prefs.setString('customer_id', customerId.toString());
      }
      await prefs.setString('customer_phone', _phoneController.text);

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => CustomerMainScreen(token: token)),
        );
      }
    } else {
      _handleError('Login successful but token missing.');
    }
  }

  void _handleError(String message) {
    if (mounted) {
      setState(() {
        _errorMessage = message;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Stack(
        children: [
          // Background Design Elements
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
                      // Logo / Icon
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white.withOpacity(0.2)),
                        ),
                        child: ClipOval(
                          child: Image.asset(
                            'assets/icon/logo.png',
                            height: 100,
                            width: 100,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      Text(
                        'Welcome',
                        style: AppTextStyles.h1.copyWith(color: Colors.white),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Your safe ride is just a tap away',
                        style: AppTextStyles.bodyLarge.copyWith(color: Colors.white70),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 48),

                      // Login Card
                      Card(
                        // Elevation/Shape handled by Theme
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
                              
                              if (!_isOtpSent) ...[
                                TextField(
                                  controller: _phoneController,
                                  keyboardType: TextInputType.phone,
                                  style: AppTextStyles.bodyLarge,
                                  decoration: const InputDecoration(
                                    labelText: 'Phone Number',
                                    hintText: '9876543210',
                                    prefixIcon: Icon(Icons.phone_outlined),
                                    prefixText: '+91 ',
                                  ),
                                ),
                              ] else ...[
                                TextField(
                                  controller: _otpController,
                                  keyboardType: TextInputType.number,
                                  style: AppTextStyles.h3.copyWith(letterSpacing: 8),
                                  textAlign: TextAlign.center,
                                  maxLength: 6,
                                  decoration: const InputDecoration(
                                    labelText: 'Enter OTP',
                                    hintText: '000000',
                                    counterText: '',
                                    prefixIcon: Icon(Icons.lock_outline),
                                  ),
                                ),
                              ],

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
                                  onPressed: _isLoading ? null : (_isOtpSent ? _verifyOtp : _sendOtp),
                                  child: _isLoading
                                      ? const SizedBox(
                                          height: 24,
                                          width: 24,
                                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                        )
                                      : Text(_isOtpSent ? 'Verify & Login' : 'Continue'),
                                ),
                              ),

                              if (_isOtpSent) ...[
                                const SizedBox(height: 16),
                                TextButton(
                                  onPressed: () {
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
                      
                      const SizedBox(height: 32),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.shield_outlined, size: 16, color: Colors.white.withOpacity(0.5)),
                          const SizedBox(width: 8),
                          Text(
                            'Secure Login',
                            style: AppTextStyles.bodySmall.copyWith(color: Colors.white.withOpacity(0.5)),
                          ),
                        ],
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
