import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api_client.dart';
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
  String? _smsToken;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    if (_phoneController.text.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter your phone number';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _apiClient.sendLoginOtp(
        phone: _phoneController.text,
      );

      if (result.success) {
        setState(() {
          _isOtpSent = true;
          _smsToken = result.body['smsToken'] ?? result.body['data']?['smsToken'];
          _isLoading = false;
        });
        
        // In dev mode, OTP might be returned in response
        final otp = result.body['otp'] ??
            result.body['data']?['otp'] ??
            result.body['data']?['generatedOTP'];
        if (otp != null) _otpController.text = otp.toString();
      } else {
        setState(() {
          _errorMessage = result.body['message'] ?? 'Failed to send OTP';
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

  Future<void> _verifyOtp() async {
    if (_otpController.text.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter OTP';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _apiClient.verifyLoginOtp(
        phone: _phoneController.text,
        otp: _otpController.text,
        smsToken: _smsToken ?? '',
      );

      if (result.success && result.body['data'] != null) {
        final data = result.body['data'];
        final token = data['token'] ?? data['accessToken'];
        final customer = data['customer'] ?? {};
        final customerId = data['customerId'] ?? customer['customerId'];
        final customerName = customer['name']?.toString();
        final adminId = customer['adminId']?.toString();

        if (token != null) {
          // Save token
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('customer_token', token);
          await prefs.setString('customer_id', customerId);
          if (customerName != null) {
            await prefs.setString('customer_name', customerName);
          }
          if (adminId != null) {
            await prefs.setString('customer_admin_id', adminId);
          }

          if (mounted) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(
                builder: (_) => CustomerMainScreen(token: token),
              ),
            );
          }
        } else {
          setState(() {
            _errorMessage = 'Token not received';
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
        _errorMessage = 'Error: $e';
        _isLoading = false;
      });
    }
  }

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
              const Icon(
                Icons.person,
                size: 80,
                color: Color(0xFF2575FC),
              ),
              const SizedBox(height: 32),
              const Text(
                'Welcome to Silver Taxi',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'Enter your phone number to continue',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  hintText: '919876543210',
                  prefixIcon: Icon(Icons.phone),
                  border: OutlineInputBorder(),
                ),
                enabled: !_isOtpSent,
              ),
              if (_isOtpSent) ...[
                const SizedBox(height: 16),
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'OTP',
                    hintText: 'Enter 4-digit OTP',
                    prefixIcon: Icon(Icons.lock),
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                Text(
                  _errorMessage!,
                  style: const TextStyle(color: Colors.red),
                  textAlign: TextAlign.center,
                ),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : (_isOtpSent ? _verifyOtp : _sendOtp),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: const Color(0xFF2575FC),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(
                        _isOtpSent ? 'Verify OTP' : 'Send OTP',
                        style: const TextStyle(fontSize: 16),
                      ),
              ),
              if (_isOtpSent) ...[
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _isOtpSent = false;
                      _otpController.clear();
                    });
                  },
                  child: const Text('Change Phone Number'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

