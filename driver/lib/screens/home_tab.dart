import 'dart:async';

import 'package:flutter/material.dart';

import '../api_client.dart';
import '../services/native_overlay_service.dart';
import '../services/overlay_notification_service.dart';
import '../services/razorpay_service.dart';
import '../services/socket_service.dart';
import '../services/trip_service.dart';
import 'payment_details_page.dart';
import 'payment_processing_page.dart';
import 'wallet_page.dart';
import 'all_trips_page.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({
    super.key,
    required this.token,
    required this.driverId,
    required this.onNavigate,
  });

  final String token;
  final String driverId;
  final Function(int index, {int? subTabIndex}) onNavigate;

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  final _api = ApiClient(baseUrl: kApiBaseUrl);
  Map<String, dynamic>? _driverDetails;
  Map<String, dynamic>? _wallet;
  Map<String, dynamic>? _bookingCounts;
  bool _loading = false;
  bool _online = false;
  bool _paymentInProgress = false;

  StreamSubscription? _walletSub;
  StreamSubscription? _bookingSub;

  @override
  void initState() {
    super.initState();
    _loadDetails();
    _setupRealtimeListeners();
  }

  @override
  void dispose() {
    _walletSub?.cancel();
    _bookingSub?.cancel();
    RazorpayService.instance.dispose();
    super.dispose();
  }

  void _setupRealtimeListeners() {
    _walletSub = SocketService().walletUpdateStream.listen((data) {
      debugPrint('HomeTab: Received wallet update: $data');
      _loadWalletOnly();
    });

    _bookingSub = SocketService().bookingUpdateStream.listen((data) {
      debugPrint('HomeTab: ========================================');
      debugPrint('HomeTab: ?????? RECEIVED BOOKING UPDATE EVENT ??????');
      debugPrint('HomeTab: Full event: $data');
      debugPrint('HomeTab: ========================================');

      final type = data['type']?.toString() ?? '';
      debugPrint('HomeTab: Event type: "$type"');

      if (type == 'NEW_TRIP_OFFER' ||
          type == 'TRIP_CANCELLED' ||
          type == 'TRIP_ACCEPTED' ||
          type.isEmpty) {
        debugPrint('HomeTab: ? Refreshing counts due to event: $type');
        _loadBookingCountsOnly();
      }
    });
  }

  Future<void> _loadDetails() async {
    setState(() => _loading = true);
    try {
      final resp = await _api.fetchDriverDetails(token: widget.token);
      final wallet = await _api.fetchWallet(token: widget.token);
      final counts =
          await TripService(apiClient: _api).getTripCounts(widget.token);

      if (mounted) {
        setState(() {
          _driverDetails = resp['data'] as Map<String, dynamic>?;
          _wallet = wallet['data'] as Map<String, dynamic>?;
          _bookingCounts = counts;
          _online =
              (_driverDetails?['onlineStatus']?.toString().toLowerCase() ==
                  'online');
        });
      }
    } catch (e) {
      debugPrint('Error: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadWalletOnly() async {
    try {
      final wallet = await _api.fetchWallet(token: widget.token);
      if (mounted) {
        setState(() {
          _wallet = wallet['data'] as Map<String, dynamic>?;
        });
      }
    } catch (e) {
      debugPrint('Error loading wallet: $e');
    }
  }

  Future<void> _loadBookingCountsOnly() async {
    debugPrint('HomeTab: ========================================');
    debugPrint('HomeTab: ?? Refreshing booking counts...');
    debugPrint('HomeTab: ========================================');
    try {
      final counts =
          await TripService(apiClient: _api).getTripCounts(widget.token);
      if (mounted) {
        debugPrint('HomeTab: ? Counts received: $counts');
        setState(() {
          _bookingCounts = counts;
        });
        debugPrint('HomeTab: ? State updated with new counts');
      } else {
        debugPrint('HomeTab: ?? Widget not mounted, skipping state update');
      }
    } catch (e) {
      debugPrint('HomeTab: ? Error loading booking counts: $e');
    }
  }

  Future<void> _toggleOnline(bool value) async {
    setState(() => _online = value);
    try {
      await _api.updateOnlineStatus(token: widget.token, isOnline: value);
    } catch (e) {
      setState(() => _online = !value);
      if (mounted) {
        ScaffoldMessenger.maybeOf(context)
            ?.showSnackBar(SnackBar(content: Text('Failed: $e')));
      }
    }
  }

  void _showRechargeDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Recharge Wallet'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Amount',
            prefixText: '? ',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final amount = double.tryParse(controller.text);
              if (amount == null || amount <= 0) return;

              Navigator.pop(ctx);
              _startRecharge(amount);
            },
            child: const Text('Recharge'),
          ),
        ],
      ),
    );
  }

  Future<void> _startRecharge(double amount) async {
    setState(() => _paymentInProgress = true);
    PaymentProcessingPage.show(context, message: 'Creating payment order...');

    try {
      final orderRes = await _api.createWalletPaymentOrder(
          token: widget.token, amount: amount);
      if (!orderRes.success) {
        throw Exception(
            orderRes.body['message'] ?? 'Failed to create payment order');
      }
      if (!mounted) return;
      final data = orderRes.body['data'] as Map<String, dynamic>? ?? {};
      final key = data['key']?.toString() ?? '';
      final orderId = data['orderId']?.toString() ?? '';
      final amountPaise = int.tryParse(data['amount']?.toString() ?? '') ??
          (amount * 100).round();
      if (key.isEmpty || orderId.isEmpty) {
        throw Exception('Invalid payment order response');
      }

      if (mounted) {
        PaymentProcessingPage.hide(context);
        PaymentProcessingPage.show(
          context,
          message:
              'Opening payment gateway...\nPlease complete payment in Razorpay.\nDo not close the app.',
        );
      }

      String? formattedPhone = _driverDetails?['phone']?.toString();
      if (formattedPhone != null && formattedPhone.isNotEmpty) {
        formattedPhone = formattedPhone.replaceAll(RegExp(r'[\s\-\(\)]'), '');
        if (!formattedPhone.startsWith('+')) {
          if (formattedPhone.startsWith('0')) {
            formattedPhone = formattedPhone.substring(1);
          }
          if (formattedPhone.length == 10) {
            formattedPhone = '+91$formattedPhone';
          } else if (formattedPhone.length == 12 &&
              formattedPhone.startsWith('91')) {
            formattedPhone = '+$formattedPhone';
          }
        }
      }

      debugPrint('[HomeTab] ========================================');
      debugPrint('[HomeTab] ?? Starting Razorpay payment...');
      debugPrint('[HomeTab]   - Order ID: $orderId');
      debugPrint(
          '[HomeTab]   - Amount: ?${(amountPaise / 100).toStringAsFixed(2)}');
      debugPrint('[HomeTab] ? Waiting for payment confirmation...');
      debugPrint('[HomeTab] ========================================');

      final paymentResult = await RazorpayService.instance.startPayment(
        key: key,
        amountInPaise: amountPaise,
        name: 'Driver Wallet',
        description: 'Wallet recharge',
        orderId: orderId,
        contact: formattedPhone,
        email: _driverDetails?['email']?.toString(),
      );

      debugPrint('[HomeTab] ? Payment completed in Razorpay');

      if (paymentResult.paymentId.isEmpty ||
          paymentResult.orderId.isEmpty ||
          paymentResult.signature.isEmpty) {
        throw Exception(
            'Payment details are incomplete. Payment may not have been completed.');
      }

      if (!mounted) return;

      PaymentProcessingPage.hide(context);
      PaymentProcessingPage.show(context, message: 'Verifying payment...');

      debugPrint('[HomeTab] Verifying payment with backend...');
      await _confirmRecharge(
        orderId:
            paymentResult.orderId.isNotEmpty ? paymentResult.orderId : orderId,
        paymentId: paymentResult.paymentId,
        signature: paymentResult.signature,
      );
    } catch (e) {
      if (mounted) {
        PaymentProcessingPage.hide(context);
        setState(() => _paymentInProgress = false);
      }
      if (mounted) {
        final errorMessage = e.toString();
        debugPrint('[HomeTab] Payment error: $errorMessage');

        final isOtpError = errorMessage.toLowerCase().contains('otp') ||
            errorMessage.toLowerCase().contains('timeout');

        final messenger = ScaffoldMessenger.maybeOf(context);
        messenger?.showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            duration: const Duration(seconds: 5),
            action: isOtpError
                ? SnackBarAction(
                    label: 'Help',
                    textColor: Colors.white,
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('OTP Not Received?'),
                          content: const Text(
                            'If you\'re not receiving OTP:\n\n'
                            '1. Check the phone number linked to your card (not the app phone)\n'
                            '2. Ensure SMS permissions are enabled\n'
                            '3. Check your network connection\n'
                            '4. Try using "Pay on bank\'s page" option in Razorpay\n'
                            '5. Contact your bank if the issue persists\n\n'
                            'Note: OTP is sent to the phone number registered with your card, not your driver app phone number.',
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(ctx),
                              child: const Text('OK'),
                            ),
                          ],
                        ),
                      );
                    },
                  )
                : null,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _paymentInProgress = false);
      }
    }
  }

  Future<void> _confirmRecharge({
    required String orderId,
    required String paymentId,
    required String signature,
  }) async {
    if (!mounted) return;
    PaymentProcessingPage.hide(context);
    PaymentProcessingPage.show(context, message: 'Confirming payment...');
    try {
      final res = await _api.verifyWalletPayment(
        token: widget.token,
        orderId: orderId,
        paymentId: paymentId,
        signature: signature,
      );
      if (res.success) {
        if (mounted) {
          PaymentProcessingPage.hide(context);
          ScaffoldMessenger.maybeOf(context)?.showSnackBar(
            const SnackBar(content: Text('? Recharge successful')),
          );
        }
        debugPrint(
            '[HomeTab] ? Payment verified successfully, reloading wallet details...');
        await _loadDetails();
        debugPrint('[HomeTab] ? Wallet details reloaded');
      } else {
        final errorMsg = res.body['message']?.toString() ??
            res.body['error']?.toString() ??
            'Recharge confirmation failed';
        throw Exception(errorMsg);
      }
    } catch (e) {
      if (mounted) {
        PaymentProcessingPage.hide(context);
        final errorMessage = e.toString().replaceAll('Exception: ', '');
        debugPrint('[HomeTab] Payment verification error: $errorMessage');

        final isServerBusy =
            errorMessage.toLowerCase().contains('server is busy') ||
                errorMessage.toLowerCase().contains('server busy') ||
                errorMessage.toLowerCase().contains('timeout') ||
                errorMessage.toLowerCase().contains('network error');

        ScaffoldMessenger.maybeOf(context)?.showSnackBar(
          SnackBar(
            content: Text(isServerBusy
                ? '?? Server is busy. Your payment was successful, but verification is pending. Please check your wallet balance in a few moments.'
                : '? Error confirming payment: $errorMessage'),
            duration: Duration(seconds: isServerBusy ? 8 : 5),
            action: isServerBusy
                ? SnackBarAction(
                    label: 'Refresh',
                    textColor: Colors.white,
                    onPressed: () {
                      _loadDetails();
                    },
                  )
                : null,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _paymentInProgress = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = _driverDetails?['name'] ?? 'Driver';
    final phone = _driverDetails?['phone'] ?? widget.driverId;
    final photo = _driverDetails?['profilePicture'];
    final balance = _wallet?['balance'] ?? 0.0;
    final counts = _bookingCounts ?? {};

    return PopScope(
      canPop: !_paymentInProgress,
      onPopInvokedWithResult: (didPop, result) {
        if (_paymentInProgress && didPop) {
          final messenger = ScaffoldMessenger.maybeOf(context);
          messenger?.showSnackBar(
            const SnackBar(
              content: Text(
                  'Payment in progress. Please complete or cancel the payment first.'),
              duration: Duration(seconds: 3),
            ),
          );
        }
      },
      child: Scaffold(
        body: SafeArea(
          child: RefreshIndicator(
            onRefresh: _loadDetails,
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: const TextStyle(
                                fontSize: 20, fontWeight: FontWeight.bold),
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(phone,
                              style: TextStyle(color: Colors.grey.shade600)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        shape: BoxShape.circle,
                        image: photo != null && photo.isNotEmpty
                            ? DecorationImage(
                                image: NetworkImage(transformImageUrl(photo)),
                                fit: BoxFit.cover)
                            : null,
                      ),
                      child: photo == null || photo.isEmpty
                          ? const Icon(Icons.person, color: Colors.grey)
                          : null,
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2575FC),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF2575FC).withValues(alpha: 0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Wallet Balance',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w500)),
                          Row(
                            children: [
                              const Text('Online',
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w500)),
                              const SizedBox(width: 8),
                              Switch(
                                value: _online,
                                onChanged: _toggleOnline,
                                activeThumbColor: Colors.white,
                                activeTrackColor: Colors.greenAccent,
                                inactiveThumbColor: Colors.white,
                                inactiveTrackColor:
                                    Colors.grey.withValues(alpha: 0.5),
                              ),
                            ],
                          )
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '? $balance',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.bold),
                      ),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          style: TextButton.styleFrom(
                              foregroundColor: Colors.white),
                          onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) =>
                                    WalletPage(token: widget.token)),
                          ),
                          child: const Text('View history'),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _buildWalletButton(
                            label: '+ Recharge',
                            onTap: _showRechargeDialog,
                            isPrimary: true,
                          ),
                          const SizedBox(width: 12),
                          _buildWalletButton(
                            label: 'Payments Details',
                            icon: Icons.credit_card,
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) =>
                                      PaymentDetailsPage(token: widget.token)),
                            ),
                            isPrimary: false,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Trip Details',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.3,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Manage your trips',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF2575FC).withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        icon:
                            const Icon(Icons.refresh, color: Color(0xFF2575FC)),
                        onPressed: _loading ? null : _loadDetails,
                        tooltip: 'Refresh',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 0.95,
                  children: [
                    _buildStatCard(
                      'New Requests',
                      counts['offers'] ?? 0,
                      Icons.new_label,
                      Colors.orange.shade400,
                      Colors.orange.shade50,
                      const Color(0xFFFF6B35),
                      () {
                        // Navigate to new page showing all trips
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => AllTripsPage(token: widget.token),
                          ),
                        );
                      },
                    ),
                    _buildStatCard(
                      'Upcoming',
                      counts['accepted'] ?? 0,
                      Icons.schedule,
                      const Color(0xFF5C6BC0),
                      const Color(0xFFE8EAF6),
                      const Color(0xFF3F51B5),
                      () => widget.onNavigate(1, subTabIndex: 1),
                    ),
                    _buildStatCard(
                      'Active',
                      counts['started'] ?? 0,
                      Icons.directions_car,
                      Colors.green.shade600,
                      Colors.green.shade50,
                      const Color(0xFF2E7D32),
                      () => widget.onNavigate(1, subTabIndex: 2),
                    ),
                    _buildStatCard(
                      'Completed',
                      counts['completed'] ?? 0,
                      Icons.check_circle,
                      Colors.teal.shade600,
                      Colors.teal.shade50,
                      const Color(0xFF00695C),
                      () => widget.onNavigate(1, subTabIndex: 3),
                    ),
                    _buildStatCard(
                      'Cancelled',
                      counts['cancelled'] ?? 0,
                      Icons.cancel,
                      Colors.red.shade400,
                      Colors.red.shade50,
                      const Color(0xFFC62828),
                      () => widget.onNavigate(1, subTabIndex: 4),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      ElevatedButton.icon(
                        onPressed: () {
                          OverlayNotificationService().testShowOverlay();
                          if (!mounted) return;
                          ScaffoldMessenger.maybeOf(context)?.showSnackBar(
                            const SnackBar(
                              content: Text(
                                  'Test overlay triggered - check top of screen'),
                              duration: Duration(seconds: 2),
                            ),
                          );
                        },
                        icon: const Icon(Icons.notification_important),
                        label: const Text('Test Overlay Notification'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton.icon(
                        onPressed: () async {
                          final nativeOverlay = NativeOverlayService();
                          final hasPermission =
                              await nativeOverlay.checkOverlayPermission();
                          if (!mounted) return;
                          final messenger = ScaffoldMessenger.maybeOf(context);
                          if (messenger == null) return;
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text(
                                hasPermission
                                    ? 'Overlay permission granted'
                                    : 'Overlay permission NOT granted - tap to request',
                              ),
                              duration: const Duration(seconds: 3),
                              action: hasPermission
                                  ? null
                                  : SnackBarAction(
                                      label: 'Request',
                                      onPressed: () => nativeOverlay
                                          .requestOverlayPermission(),
                                    ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.security),
                        label: const Text('Check Overlay Permission'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildWalletButton({
    required String label,
    IconData? icon,
    required VoidCallback onTap,
    required bool isPrimary,
  }) {
    return Expanded(
      child: Material(
        color: isPrimary
            ? Colors.white.withValues(alpha: 0.2)
            : Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
          side: isPrimary
              ? BorderSide.none
              : const BorderSide(color: Colors.white70),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(30),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            alignment: Alignment.center,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (icon != null) ...[
                  Icon(icon, color: Colors.white, size: 18),
                  const SizedBox(width: 6)
                ],
                Text(label,
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    int count,
    IconData icon,
    Color iconColor,
    Color bgColor,
    Color accentColor,
    VoidCallback onTap,
  ) {
    final hasCount = count > 0;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: hasCount
                  ? accentColor.withValues(alpha: 0.2)
                  : Colors.grey.shade200,
              width: hasCount ? 1.5 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: hasCount
                    ? accentColor.withValues(alpha: 0.1)
                    : Colors.black.withValues(alpha: 0.04),
                blurRadius: hasCount ? 12 : 8,
                offset: const Offset(0, 4),
                spreadRadius: hasCount ? 1 : 0,
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: bgColor,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: iconColor.withValues(alpha: 0.2),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Icon(icon, color: iconColor, size: 28),
                  ),
                  if (hasCount)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: accentColor,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: accentColor.withValues(alpha: 0.4),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        count > 99 ? '99+' : '$count',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '0',
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
              const Spacer(),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade700,
                      letterSpacing: 0.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    hasCount
                        ? '$count ${count == 1 ? 'trip' : 'trips'}'
                        : 'No trips',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: hasCount ? accentColor : Colors.grey.shade500,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
