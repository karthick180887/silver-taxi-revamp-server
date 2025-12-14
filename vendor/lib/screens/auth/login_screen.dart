import 'dart:convert';
import 'package:flutter/material.dart';
import '../../api_client.dart';
import '../../design_system.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../main_layout.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailPhoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _errorMessage;

  @override
  void dispose() {
    _emailPhoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final input = _emailPhoneController.text.trim();
      final password = _passwordController.text;
      
      // Determine if input is email or phone (simple heuristic)
      final isEmail = input.contains('@');
      
      final api = VendorApiClient();
      final result = await api.login(
        email: isEmail ? input : null,
        phone: isEmail ? null : input,
        password: password,
      );

      if (result.statusCode == 200 || result.statusCode == 201) {
        // Success
        if (result.data is! Map<String, dynamic>) {
           setState(() => _errorMessage = "Unexpected response format: ${result.data}");
           return;
        }
        final responseData = result.data as Map<String, dynamic>;
        // Handle nested data object (standard API response structure)
        final innerData = responseData['data'] as Map<String, dynamic>?;
        final token = (innerData?['token'] ?? responseData['token']) as String?;
        
        if (token != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('vendor_token', token);
          
          try {
            // Decode token to get adminId and vendorId
            final parts = token.split('.');
            if (parts.length == 3) {
              final payload = parts[1];
              final normalized = base64Url.normalize(payload);
              final resp = utf8.decode(base64Url.decode(normalized));
              final payloadMap = json.decode(resp);
              
              if (payloadMap is Map<String, dynamic>) {
                final adminId = payloadMap['adminId']?.toString();
                final userData = payloadMap['userData'];
                final vendorId = userData is Map ? userData['id']?.toString() : null;
                
                if (adminId != null) await prefs.setString('admin_id', adminId);
                if (vendorId != null) await prefs.setString('vendor_id', vendorId);
              }
            }
          } catch (e) {
            debugPrint('Error decoding token: $e');
          }
          
          if (mounted) {
             Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const MainLayout()),
            );
          }
        } else {
           setState(() => _errorMessage = "Login succeeded but no token returned.");
        }
      } else {
        setState(() => _errorMessage = result.message ?? "Login failed");
      }
    } catch (e) {
      setState(() => _errorMessage = "An error occurred: $e");
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo / Header
                  const Icon(
                    Icons.local_taxi_rounded,
                    size: 64,
                    color: AppColors.primary,
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Welcome back',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.h1,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Sign in to your vendor account',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 32),

                  // Error Message
                  if (_errorMessage != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 24),
                      decoration: BoxDecoration(
                        color: AppColors.error.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.error.withOpacity(0.2)),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: AppTextStyles.bodyMedium.copyWith(color: AppColors.error),
                      ),
                    ),

                  // Email/Phone Field
                  TextFormField(
                    controller: _emailPhoneController,
                    decoration: const InputDecoration(
                      labelText: 'Email or Phone',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Please enter your email or phone';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Password Field
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your password';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),

                  // Login Button
                  ElevatedButton(
                    onPressed: _isLoading ? null : _handleLogin,
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Sign in'),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Forgot Password Link (Placeholder)
                  TextButton(
                    onPressed: () {
                      // TODO: Implement Forgot Password
                    },
                    child: const Text('Forgot password?'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
