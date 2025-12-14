import 'package:flutter/material.dart';
import 'screens/main_screen.dart';
import 'screens/login_page.dart';
import 'services/storage_service.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'services/fcm_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    await FcmService().init();
  } catch (e) {
    debugPrint('Error initializing Firebase: $e');
  }
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
      title: 'Driver Partner',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.white,
        fontFamily: 'Inter', // Applying global font if available, fallback to default
      ),
      home: _initialRoute,
    );
  }
}

