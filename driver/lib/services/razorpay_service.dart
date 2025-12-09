import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

class RazorpayPaymentResult {
  RazorpayPaymentResult({
    required this.paymentId,
    required this.orderId,
    required this.signature,
  });

  final String paymentId;
  final String orderId;
  final String signature;
}

class RazorpayService {
  RazorpayService._() {
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handleSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handleError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  static final RazorpayService instance = RazorpayService._();

  late final Razorpay _razorpay;
  Completer<RazorpayPaymentResult>? _paymentCompleter;
  Timer? _timeoutTimer;

  Future<RazorpayPaymentResult> startPayment({
    required String key,
    required int amountInPaise,
    required String name,
    required String description,
    required String orderId,
    String? contact,
    String? email,
  }) {
    // Cancel any existing timeout
    _timeoutTimer?.cancel();
    _timeoutTimer = null;
    
    // Complete previous payment if it exists (safely)
    if (_paymentCompleter != null && !_paymentCompleter!.isCompleted) {
      try {
        _paymentCompleter!.completeError(Exception('Previous payment abandoned'));
      } catch (e) {
        // Ignore if already completed
        _log('[RazorpayService] ⚠️ Previous payment completer already completed: $e');
      }
    }
    
    _paymentCompleter = Completer<RazorpayPaymentResult>();

    final options = {
      'key': key,
      'amount': amountInPaise,
      'currency': 'INR',
      'name': name,
      'description': description,
      'order_id': orderId,
      'prefill': {
        if (contact != null && contact.isNotEmpty) 'contact': contact,
        if (email != null && email.isNotEmpty) 'email': email,
      },
      'theme': {'color': '#2575FC'},
      // Enable OTP auto-read if available
      'readonly': {
        'contact': contact != null && contact.isNotEmpty,
        'email': email != null && email.isNotEmpty,
      },
      // Enable retry for failed payments
      'retry': {'enabled': true, 'max_count': 4},
    };
    
    // Log payment options for debugging
    _log('[RazorpayService] ========================================');
    _log('[RazorpayService] 🚀 Starting payment with options:');
    _log('[RazorpayService]   - Order ID: $orderId');
    _log('[RazorpayService]   - Amount: $amountInPaise paise (₹${(amountInPaise / 100).toStringAsFixed(2)})');
    _log('[RazorpayService]   - Contact: ${contact ?? "not provided"}');
    _log('[RazorpayService]   - Email: ${email ?? "not provided"}');
    _log('[RazorpayService] ⏳ Waiting for payment confirmation...');
    _log('[RazorpayService] 📱 For UPI: Payment will complete in external app, then return here');
    _log('[RazorpayService] 💳 For Cards: Enter OTP and wait for confirmation');
    _log('[RazorpayService] ⚠️ Note: Payment ID is only provided on successful payment');
    _log('[RazorpayService] ⚠️ If payment is cancelled/failed, no payment ID will be provided');
    _log('[RazorpayService] ========================================');

    _razorpay.open(options);
    
    // Add timeout to handle cases where dialog closes without any event
    // This prevents the future from hanging indefinitely
    _timeoutTimer = Timer(const Duration(minutes: 10), () {
      _completeWithError('Payment timeout: No response received. Payment may have been cancelled or failed.');
    });
    
    // Return the future - it will complete when:
    // 1. Payment succeeds (EVENT_PAYMENT_SUCCESS) - with valid payment ID
    // 2. Payment fails (EVENT_PAYMENT_ERROR) - no payment ID (this is normal)
    // 3. External wallet selected (EVENT_EXTERNAL_WALLET) - then waits for success/error from external app
    // 4. Timeout (10 minutes) - if no event is received
    return _paymentCompleter!.future;
  }

  void _handleSuccess(PaymentSuccessResponse response) {
    _log('[RazorpayService] ========================================');
    _log('[RazorpayService] ✅✅✅ PAYMENT SUCCESS EVENT RECEIVED ✅✅✅');
    _log('[RazorpayService]   - Payment ID: ${response.paymentId}');
    _log('[RazorpayService]   - Order ID: ${response.orderId}');
    _log('[RazorpayService]   - Signature: ${response.signature?.substring(0, 20) ?? "N/A"}...');
    _log('[RazorpayService] ========================================');
    
    final paymentId = response.paymentId ?? '';
    final orderId = response.orderId ?? '';
    final signature = response.signature ?? '';
    
    // CRITICAL: Validate that all required payment details are present
    // If any are missing, treat this as an error (should not happen in production)
    if (paymentId.isEmpty || orderId.isEmpty || signature.isEmpty) {
      _log('[RazorpayService] ❌ ERROR: Missing payment details in success response');
      _log('[RazorpayService]   - Payment ID empty: ${paymentId.isEmpty}');
      _log('[RazorpayService]   - Order ID empty: ${orderId.isEmpty}');
      _log('[RazorpayService]   - Signature empty: ${signature.isEmpty}');
      _log('[RazorpayService] ❌ Rejecting payment - cannot proceed without valid payment details');
      
      _completeWithError('Payment success event received but payment details are missing. Payment may not have been completed.');
      return;
    }
    
    // Additional validation: Check if payment ID looks valid (should start with 'pay_' for Razorpay)
    // Note: Payment ID is ONLY provided on successful payment
    // If payment fails or is cancelled, no payment ID is generated
    if (!paymentId.startsWith('pay_')) {
      _log('[RazorpayService] ❌ ERROR: Payment ID format is invalid: $paymentId');
      _log('[RazorpayService] ❌ Expected format: pay_xxxxxxxxxxxxx');
      _log('[RazorpayService] ❌ This indicates the payment was not actually completed');
      
      _completeWithError('Invalid payment ID format. Payment may not have been completed successfully.');
      return;
    }
    
    // Additional validation: Check if order ID looks valid (should start with 'order_' for Razorpay)
    if (!orderId.startsWith('order_')) {
      _log('[RazorpayService] ❌ ERROR: Order ID format is invalid: $orderId');
      _log('[RazorpayService] ❌ Expected format: order_xxxxxxxxxxxxx');
      
      _completeWithError('Invalid order ID format. Payment verification cannot proceed.');
      return;
    }
    
    // All validations passed - payment has valid details
    _log('[RazorpayService] ✅ All payment details validated successfully');
    _log('[RazorpayService]   - Payment ID format: ✓ (starts with pay_)');
    _log('[RazorpayService]   - Order ID format: ✓ (starts with order_)');
    _log('[RazorpayService]   - Signature: ✓ (present)');
    
    // Cancel timeout since payment completed
    _timeoutTimer?.cancel();
    _timeoutTimer = null;
    
    // Complete the future with success (only if not already completed)
    if (_paymentCompleter != null && !_paymentCompleter!.isCompleted) {
      _paymentCompleter!.complete(
        RazorpayPaymentResult(
          paymentId: paymentId,
          orderId: orderId,
          signature: signature,
        ),
      );
      _log('[RazorpayService] ✅ Payment result delivered to caller with valid details');
      _paymentCompleter = null; // Clear completer to prevent reuse
    } else {
      _log('[RazorpayService] ⚠️ Warning: Payment completer is null or already completed - ignoring duplicate success event');
    }
  }

  void _handleError(PaymentFailureResponse response) {
    _log('[RazorpayService] ========================================');
    _log('[RazorpayService] ❌❌❌ PAYMENT ERROR/FAILURE ❌❌❌');
    _log('[RazorpayService]   - Code: ${response.code}');
    _log('[RazorpayService]   - Message: ${response.message}');
    _log('[RazorpayService] ⚠️ Note: No payment ID is provided for failed/cancelled payments');
    _log('[RazorpayService]   This is normal - Razorpay only generates payment ID on success');
    _log('[RazorpayService] ========================================');
    
    // Check if it's an OTP-related error
    final errorMessage = (response.message ?? '').toLowerCase();
    String userFriendlyMessage = response.message ?? 'Payment failed or cancelled';
    
    // Handle different error scenarios
    if (response.code == Razorpay.PAYMENT_CANCELLED) {
      userFriendlyMessage = 'Payment cancelled by user';
    } else if (errorMessage.contains('otp') || errorMessage.contains('timeout')) {
      userFriendlyMessage = 'OTP not received. Please check:\n'
          '1. Phone number linked to your card\n'
          '2. SMS permissions on your device\n'
          '3. Network connectivity\n'
          '4. Try "Pay on bank\'s page" option';
    } else if (errorMessage.contains('network') || errorMessage.contains('connection')) {
      userFriendlyMessage = 'Network error. Please check your internet connection and try again.';
    } else if (errorMessage.contains('cancelled') || errorMessage.contains('cancel')) {
      userFriendlyMessage = 'Payment cancelled';
    }
    
    // Cancel timeout since payment failed
    _timeoutTimer?.cancel();
    _timeoutTimer = null;
    
    // Complete with error (only if not already completed)
    _completeWithError(userFriendlyMessage);
  }
  
  // Helper method to safely complete with error (prevents duplicate completions)
  void _completeWithError(String message) {
    if (_paymentCompleter != null && !_paymentCompleter!.isCompleted) {
      _paymentCompleter!.completeError(Exception(message));
      _log('[RazorpayService] ✅ Error result delivered to caller: $message');
      _paymentCompleter = null; // Clear completer to prevent reuse
    } else {
      _log('[RazorpayService] ⚠️ Warning: Payment completer is null or already completed - ignoring duplicate error event');
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    // External wallet (UPI apps like PhonePe, Google Pay, etc.) selected
    // Don't complete the future here - wait for payment success/error
    // The payment will complete in the external app, then return to Razorpay
    // Razorpay will then trigger EVENT_PAYMENT_SUCCESS or EVENT_PAYMENT_ERROR
    _log('[RazorpayService] 🔄 External wallet selected: ${response.walletName}');
    _log('[RazorpayService] ⏳ Waiting for payment confirmation from external app...');
    _log('[RazorpayService] 📱 User will complete payment in ${response.walletName}');
    _log('[RazorpayService] ⏳ Payment will be confirmed after returning from external app');
    
    // Do NOT complete the future here - let it wait for success/error event
    // The payment flow:
    // 1. User selects UPI/external wallet
    // 2. External app opens (PhonePe, Google Pay, etc.)
    // 3. User completes payment in external app
    // 4. External app returns to Razorpay
    // 5. Razorpay triggers EVENT_PAYMENT_SUCCESS with payment details
    // 6. Our _handleSuccess will complete the future
  }

  void _log(String message) {
    debugPrint(message);
  }

  void dispose() {
    _razorpay.clear();
  }
}
