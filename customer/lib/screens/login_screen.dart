import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
  String? _smsToken;
  static const String _defaultAdminId = 'admin-1';

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    if (_phoneController.text.isEmpty) {
      setState(() => _errorMessage = 'Please enter your phone number');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _apiClient.customerLogin(
        type: 'send',
        adminId: _defaultAdminId,
        phone: _phoneController.text,
      );

      if (result.success) {
        final data = result.body['data'] ?? {};
        setState(() {
          _isOtpSent = true;
          _isLoading = false;
          _smsToken = result.body['smsToken'];
        });
        
        if (result.body['otp'] != null) {
          _otpController.text = result.body['otp'].toString();
        }
      } else {
        setState(() {
          _errorMessage = result.body['message'] ?? 'Failed to send OTP';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Connection error. Please try again.';
        _isLoading = false;
      });
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpController.text.isEmpty) {
      setState(() => _errorMessage = 'Please enter OTP');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _apiClient.customerLogin(
        type: 'verify',
        adminId: _defaultAdminId,
        otp: _otpController.text,
        smsToken: _smsToken,
      );

      if (result.success && result.body['data'] != null) {
        final data = result.body['data'];
        final token = data['token'] ?? data['accessToken'];
        final customerId = data['customerId'] ?? data['customer']?['customerId'] ?? data['customer']?['id'];

        if (token != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('customer_token', token);
          if (customerId != null) {
            await prefs.setString('customer_id', customerId.toString());
          }

          if (mounted) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => CustomerMainScreen(token: token)),
            );
          }
        } else {
          setState(() {
            _errorMessage = 'Login successful but token missing.';
            _isLoading = false;
          });
        }
      } else {
        setState(() {
          _errorMessage = result.body['message'] ?? 'Invalid OTP';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Connection error. Please try again.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary, // Full colored background
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
                color: Colors.white.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),
          
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Hero Icon
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.local_taxi_rounded,
                        size: 64,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Welcome Back',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Book a safe ride in seconds',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 48),

                    // Login Card
                    Card(
                      elevation: 8,
                      shadowColor: Colors.black26,
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              _isOtpSent ? 'Verify OTP' : 'Login',
                              style: AppTextStyles.h3,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),
                            
                            if (!_isOtpSent) ...[
                              TextField(
                                controller: _phoneController,
                                keyboardType: TextInputType.phone,
                                style: AppTextStyles.bodyLarge,
                                decoration: const InputDecoration(
                                  labelText: 'Phone Number',
                                  hintText: '9876543210',
                                  prefixIcon: Icon(Icons.phone_outlined, color: AppColors.primary),
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
                                  prefixIcon: Icon(Icons.lock_outline, color: AppColors.primary),
                                ),
                              ),
                            ],

                            if (_errorMessage != null) ...[
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.error.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  _errorMessage!,
                                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ],

                            const SizedBox(height: 24),

                            SizedBox(
                              height: 50,
                              child: ElevatedButton(
                                onPressed: _isLoading ? null : (_isOtpSent ? _verifyOtp : _sendOtp),
                                child: _isLoading
                                    ? const SizedBox(
                                        height: 24,
                                        width: 24,
                                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
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
                    const SizedBox(height: 24),
                    const Text(
                      'By continuing, you agree to our Terms & Privacy Policy',
                      style: TextStyle(color: Colors.white54, fontSize: 12),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
