import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sendotp_flutter_sdk/sendotp_flutter_sdk.dart';
import 'screens/login_screen.dart';
import 'screens/main_screen.dart';
import 'design_system.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const CustomerApp());
}

class CustomerApp extends StatelessWidget {
  const CustomerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Silver Taxi Customer',
      theme: AppTheme.lightTheme,
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  String? _token;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    // Initialize MSG91 OTP Widget
    OTPWidget.initializeWidget(
      '356c70646b5a303735303838', // Widget ID
      '482940T8rHqdAb4J56940e1baP1', // Auth Token
    );
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('customer_token');
    setState(() {
      _token = token;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_token != null) {
      return CustomerMainScreen(token: _token!);
    }

    return const LoginScreen();
  }
}
