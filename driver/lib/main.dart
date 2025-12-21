import 'dart:async';
import 'package:flutter/material.dart';
import 'screens/main_screen.dart';
import 'screens/login_page.dart';
import 'screens/waiting_page.dart';
import 'services/storage_service.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'services/fcm_service.dart';
import 'design_system.dart';
import 'package:sendotp_flutter_sdk/sendotp_flutter_sdk.dart';

import 'controllers/app_controller.dart';

// Global Controller Instance
late final AppController appController;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 1. Core Init (Firebase / SDKs)
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    await FcmService().init();
  } catch (e) {
    debugPrint('Error initializing Firebase: $e');
  }
  
  // Initialize MSG91 OTP Widget
  OTPWidget.initializeWidget(
    '356c70646b5a303735303838', // Widget ID
    '482940T8rHqdAb4J56940e1baP1', // Auth Token
  );
  
  // 2. Initialize App Controller (Manages Auth & Services)
  appController = AppController();

  // 3. Run App with Error Boundary
  runZonedGuarded(() {
    runApp(const DriverApp());
  }, (error, stack) {
    debugPrint('========================================');
    debugPrint('🔴 UNHANDLED ERROR CAUGHT IN ZONE');
    debugPrint('Error: $error');
    debugPrint('========================================');
  });
}

class DriverApp extends StatelessWidget {
  const DriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: appController,
      builder: (context, child) {
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Silver Taxi Driver',
          theme: AppTheme.lightTheme,
          home: _getHomeWidget(),
        );
      },
    );
  }
  
  Widget _getHomeWidget() {
    switch (appController.state) {
      case AppState.splash:
        return const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        );
      case AppState.authenticated:
        // Pass token/id to MainScreen
        return MainScreen(
          token: appController.token!, 
          driverId: appController.driverId!
        );
      case AppState.unauthenticated:
      default:
        // Pass login callback to LoginPage if strictly needed, 
        // but LoginPage currently uses direct StorageService/Navigation.
        // We should eventually refactor LoginPage to use appController.login()
        return const LoginPage();
    }
  }
}


