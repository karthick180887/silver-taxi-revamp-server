import 'package:flutter/material.dart';

class PaymentProcessingPage extends StatelessWidget {
  const PaymentProcessingPage({super.key, required this.message});
  final String message;

  static void show(BuildContext context, {required String message}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => PaymentProcessingPage(message: message),
    );
  }

  static void hide(BuildContext context) {
    if (Navigator.of(context, rootNavigator: true).canPop()) {
      Navigator.of(context, rootNavigator: true).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: Colors.black.withValues(alpha: 0.35),
        body: Center(
          child: Container(
            padding: const EdgeInsets.all(20),
            margin: const EdgeInsets.symmetric(horizontal: 32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 16,
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 4),
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                ),
                const SizedBox(height: 8),
                const Text(
                  '⚠️ Do not close the app or navigate away',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.red, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Payment is being processed...',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
