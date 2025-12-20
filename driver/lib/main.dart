import 'package:flutter/material.dart';
import 'screens/main_screen.dart';
import 'screens/login_page.dart';
import 'services/storage_service.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'services/fcm_service.dart';
import 'services/background_service_manager.dart';
import 'design_system.dart';

import 'package:sendotp_flutter_sdk/sendotp_flutter_sdk.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    await FcmService().init();
    
    // DISABLED: Background service has Android 14+ foreground service type issues
    // TODO: Fix foreground service type declaration for flutter_background_service
    // await BackgroundServiceManager().initialize();
    // debugPrint('BackgroundServiceManager initialized');
  } catch (e) {
    debugPrint('Error initializing Firebase/Services: $e');
  }
  
  // Initialize MSG91 OTP Widget
  OTPWidget.initializeWidget(
    '356c70646b5a303735303838', // Widget ID
    '482940T8rHqdAb4J56940e1baP1', // Auth Token
  );
  
  runApp(const DriverApp());
}

class DriverApp extends StatefulWidget {
  const DriverApp({super.key});

  @override
  State<DriverApp> createState() => _DriverAppState();
}

class _DriverAppState extends State<DriverApp> {
  Widget _initialRoute = const LoginPage();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _checkAuthState();
  }

  Future<void> _checkAuthState() async {
    try {
      final token = await StorageService.getToken();
      final driverId = await StorageService.getDriverId();
      
      if (token != null && token.isNotEmpty && driverId != null && driverId.isNotEmpty) {
        setState(() {
          _initialRoute = MainScreen(token: token, driverId: driverId);
          _isLoading = false;
        });
      } else {
        setState(() {
          _initialRoute = const LoginPage();
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _initialRoute = const LoginPage();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
      );
    }
    
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Silver Taxi Driver',
      theme: AppTheme.lightTheme,
      home: _initialRoute,
    );
  }
}

