import 'dart:async';
import 'package:flutter/services.dart';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../api_client.dart';
import '../services/native_overlay_service.dart';
import '../services/overlay_notification_service.dart';
import '../services/razorpay_service.dart';
import '../services/socket_service.dart';
import '../services/trip_service.dart';
import '../services/background_service_manager.dart';
import 'payment_details_page.dart';
import 'payment_processing_page.dart';
import 'wallet_page.dart';
import 'all_trips_page.dart';
import 'package:geolocator/geolocator.dart';
import '../design_system.dart';

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
  StreamSubscription? _positionStreamSub; // NEW: Position stream subscription

  @override
  void initState() {
    super.initState();
    // Initialize socket immediately
    SocketService().init(widget.token);
    _loadDetails();
    _setupRealtimeListeners();
    
    // Listen for Native Intents (Lock Screen Wake) - NO LONGER SHOWING IN-APP DIALOG
    // Native overlay and push notifications handle trip offers
    const MethodChannel('cabigo.driver/overlay').setMethodCallHandler((call) async {
       if (call.method == 'showTripDialog') {
            debugPrint('HomeTab: 🚨 Received showTripDialog from Native - ignoring (native overlay handles it)');
            // No in-app dialog - native overlay is sufficient
       }
    });
    
    // Pending trip check is no longer needed - native overlay handles it
  }
  
  // Removed _checkPendingTripData - no longer showing in-app dialogs

  @override
  void dispose() {
    _walletSub?.cancel();
    _bookingSub?.cancel();
    _positionStreamSub?.cancel(); // NEW: Cancel position stream
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
        
        if (type == 'NEW_TRIP_OFFER') {
             debugPrint('HomeTab: 🔔 NEW_TRIP_OFFER received - native overlay will handle popup');
             
             // 1. Play Sound via Native Channel
             try {
                const MethodChannel('cabigo.driver/overlay').invokeMethod('playSound');
             } catch (e) {
                debugPrint('HomeTab: Error playing sound: $e');
             }
             
             // No in-app dialog - native overlay and push notification are sufficient
        }
      }
    });
  }

  Future<void> _loadDetails() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.fetchDriverDetails(token: widget.token),
        _api.fetchWallet(token: widget.token),
        TripService(apiClient: _api).getTripCounts(widget.token),
      ]);

      final resp = results[0] as Map<String, dynamic>;
      final wallet = results[1] as Map<String, dynamic>;
      final counts = results[2] as Map<String, dynamic>;

      if (mounted) {
        // DEBUG: Log what the API returns for isOnline field
        debugPrint('HomeTab: ========================================');
        debugPrint('HomeTab: _loadDetails - API Response:');
        debugPrint('HomeTab: isOnline value: ${resp['data']?['isOnline']}');
        debugPrint('HomeTab: isOnline type: ${resp['data']?['isOnline'].runtimeType}');
        debugPrint('HomeTab: Full driver data keys: ${(resp['data'] as Map?)?.keys.toList()}');
        debugPrint('HomeTab: ========================================');
        
        setState(() {
          _driverDetails = resp['data'] as Map<String, dynamic>?;
          _wallet = wallet['data'] as Map<String, dynamic>?;
          _bookingCounts = counts;
          // Backend stores isOnline as boolean, not onlineStatus as string
          _online = _driverDetails?['isOnline'] == true;
          debugPrint('HomeTab: _online set to: $_online');
        });

        // NEW: If backend says we are Online, resume location tracking immediately
        if (_online) {
          debugPrint('HomeTab: Driver is Online, resuming location streaming...');
          _checkPermissionsAndStartStreaming();
        }
      }
    } catch (e) {
      debugPrint('Error: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // Helper to check permissions and start streaming without making API calls
  Future<void> _checkPermissionsAndStartStreaming() async {
    try {
        bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (!serviceEnabled) {
             debugPrint('HomeTab: Location services disabled, cannot start stream');
             return;
        }

        LocationPermission permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
          if (permission == LocationPermission.denied) {
             debugPrint('HomeTab: Location permission denied');
             return;
          }
        }
        
        if (permission == LocationPermission.deniedForever) {
             debugPrint('HomeTab: Location permission permanently denied');
             return;
        }

        _startLocationStreaming();
    } catch (e) {
        debugPrint('HomeTab: Error in _checkPermissionsAndStartStreaming: $e');
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
    // Optimistic UI update
    setState(() => _online = value);

    try {
      // 1. If going ONLINE, handle permissions and start tracking BEFORE API call
      if (value) {
        bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (!serviceEnabled) {
          throw Exception('Location services are disabled.');
        }

        LocationPermission permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
          if (permission == LocationPermission.denied) {
            throw Exception('Location permissions are denied');
          }
        }
        
        if (permission == LocationPermission.deniedForever) {
          throw Exception('Location permissions are permanently denied, we cannot request permissions.');
        }

        // Add 100ms delay to ensure context is valid if needed (optional safety)
        
        _startLocationStreaming();
        
        // DISABLED: Background service has Android 14+ foreground service type issues
        // TODO: Fix foreground service type declaration for flutter_background_service
        // BackgroundServiceManager().startService(widget.token);
        // debugPrint('HomeTab: Started background service for socket keep-alive');
      } else {
        // If going OFFLINE, stop tracking and background service
        _stopLocationStreaming();
        // BackgroundServiceManager().stopService();
        // debugPrint('HomeTab: Stopped background service');
      }

      // 2. Call API to update status
      await _api.updateOnlineStatus(token: widget.token, isOnline: value);
      
    } catch (e) {
      // Revert state on error
      setState(() => _online = !value);
      _stopLocationStreaming(); // Ensure stopped if it failed
      
      if (mounted) {
        ScaffoldMessenger.maybeOf(context)
            ?.showSnackBar(SnackBar(content: Text('Failed: ${e.toString().replaceAll("Exception: ", "")}')));
      }
    }
  }

  void _startLocationStreaming() {
    _positionStreamSub?.cancel(); // Cancel existing if any
    
    debugPrint("HomeTab: Starting location streaming...");
    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 20, // Send update every 20 meters to save bandwidth/battery while "Online" (not on trip)
    );

    _positionStreamSub = Geolocator.getPositionStream(locationSettings: locationSettings).listen(
      (Position? position) {
        if (position != null) {
          debugPrint("HomeTab: Location update: ${position.latitude}, ${position.longitude}");
          SocketService().sendLocationUpdate(
            position.latitude, 
            position.longitude, 
            position.heading
          );
        }
      },
      onError: (e) {
         debugPrint("HomeTab: Location stream error: $e");
      }
    );
  }

  void _stopLocationStreaming() {
    debugPrint("HomeTab: Stopping location streaming...");
    _positionStreamSub?.cancel();
    _positionStreamSub = null;
  }

  void _showRechargeDialog() {
    final controller = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            left: 24,
            right: 24,
            top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Detail Your Wallet',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Enter amount to add to your wallet',
              style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              style: const TextStyle(
                  fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black),
              decoration: InputDecoration(
                prefixText: '₹ ',
                prefixStyle: const TextStyle(
                    fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black),
                hintText: '0.00',
                filled: true,
                fillColor: Colors.grey.shade50,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () async {
                  final amount = double.tryParse(controller.text);
                  if (amount == null || amount <= 0) return;

                  Navigator.pop(ctx);
                  _startRecharge(amount);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Text('Proceed to Pay',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
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

  void _showTripOfferDialog(Map<String, dynamic> trip) {
    if (!mounted) return;
    
    // Extract details
    final tripId = trip['ids.bookingId'] ?? trip['bookingId'] ?? trip['ids.tripId'] ?? trip['tripId'] ?? '';
    final pickup = trip['pickupLocation'] ?? trip['pickup'] ?? 'Unknown location';
    final drop = trip['dropLocation'] ?? trip['drop'] ?? 'Unknown destination';
    final fare = trip['estimatedFare'] ?? trip['fare'] ?? '0';
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('New Trip Offer! 🚗'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.my_location, color: Colors.green),
              title: const Text('Pickup'),
              subtitle: Text(pickup.toString()),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.location_on, color: Colors.red),
              title: const Text('Drop'),
              subtitle: Text(drop.toString()),
            ),
            const SizedBox(height: 10),
            Text('💰 Fare: ₹$fare', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
               // Reject logic if needed
               Navigator.pop(ctx);
            },
            child: const Text('IGNORE', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              // Navigate to AllTripsPage or trigger accept
               Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => AllTripsPage(
                    token: widget.token,
                    status: 'new-booking', // Use backend status constant
                    title: 'New Requests',
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('VIEW', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final name = _driverDetails?['name'] ?? 'Driver';
    final photo = _driverDetails?['profilePicture'];
    final balance = _wallet?['balance'] ?? 0.0;
    final counts = _bookingCounts ?? {};

    return PopScope(
      canPop: !_paymentInProgress,
      onPopInvokedWithResult: (didPop, result) {
        if (_paymentInProgress && didPop) {
          ScaffoldMessenger.maybeOf(context)?.showSnackBar(
            const SnackBar(
              content: Text('Payment in progress. Please complete or cancel the payment first.'),
              duration: Duration(seconds: 3),
            ),
          );
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: RefreshIndicator(
            onRefresh: _loadDetails,
            color: AppColors.primary,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
              children: [
                // 1. Header with Profile & Notification
                Row(
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.border, width: 2),
                        boxShadow: [
                          BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10)
                        ],
                        image: photo != null && photo.isNotEmpty
                            ? DecorationImage(
                                image: NetworkImage(transformImageUrl(photo)),
                                fit: BoxFit.cover)
                            : null,
                      ),
                      child: photo == null || photo.isEmpty
                          ? const Icon(CupertinoIcons.person_fill,
                              color: AppColors.textTertiary)
                          : null,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Hello, $name',
                            style: AppTextStyles.h2,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            _online ? 'You are Online' : 'You are Offline',
                            style: AppTextStyles.label.copyWith(
                              color: _online ? AppColors.success : AppColors.textTertiary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    _buildStatusSwitch(),
                  ],
                ),

                const SizedBox(height: 24),

                // 2. Premium Wallet Card
                Container(
                  height: 180,
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Total Balance',
                                style: AppTextStyles.bodyMedium.copyWith(color: Colors.white.withOpacity(0.8)),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '₹ ${balance.toStringAsFixed(2)}',
                                style: AppTextStyles.h1.copyWith(color: Colors.white, fontSize: 32),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(CupertinoIcons.creditcard,
                                color: Colors.white),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _showRechargeDialog,
                              icon: const Icon(CupertinoIcons.add, size: 16),
                              label: const Text('Add Money'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: AppColors.primary,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                textStyle: AppTextStyles.button.copyWith(fontSize: 14),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                    builder: (_) =>
                                        WalletPage(token: widget.token)),
                              ),
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                      color: Colors.white.withOpacity(0.3)),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(CupertinoIcons.arrow_right,
                                    color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                // 3. Stats Grid Label
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Overview',
                      style: AppTextStyles.h3,
                    ),
                    InkWell(
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => AllTripsPage(token: widget.token),
                        ),
                      ),
                      child: Text(
                        'See All',
                        style: AppTextStyles.label.copyWith(color: AppColors.secondary),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // 4. Modern Stats Grid
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.1,
                  children: [
                    _buildModernStatCard(
                      label: 'New Requests',
                      count: counts['offers'] ?? 0,
                      color: AppColors.secondary,
                      icon: CupertinoIcons.bell_fill,
                      onTap: () {
                         Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => AllTripsPage(
                              token: widget.token,
                              status: kTripStatusNew,
                              title: 'New Requests',
                            ),
                          ),
                        );
                      },
                    ),
                    _buildModernStatCard(
                      label: 'Not Started',
                      count: counts['accepted'] ?? 0,
                      color: const Color(0xFF6366F1), // Indigo
                      icon: CupertinoIcons.time_solid,
                      onTap: () {
                         Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => AllTripsPage(
                              token: widget.token,
                              status: kTripStatusNotStarted,
                              title: 'Not Started Trips',
                            ),
                          ),
                        );
                      },
                    ),
                    _buildModernStatCard(
                      label: 'Started',
                      count: counts['started'] ?? 0,
                      color: AppColors.success,
                      icon: CupertinoIcons.car_detailed,
                      onTap: () {
                         Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => AllTripsPage(
                              token: widget.token,
                              status: kTripStatusStarted,
                              title: 'Started Trips',
                            ),
                          ),
                        );
                      },
                    ),
                    _buildModernStatCard(
                      label: 'Completed',
                      count: counts['completed'] ?? 0,
                      color: AppColors.primary,
                      icon: CupertinoIcons.checkmark_circle_fill,
                      onTap: () {
                         Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => AllTripsPage(
                              token: widget.token,
                              status: kTripStatusCompleted,
                              title: 'Completed Trips',
                            ),
                          ),
                        );
                      },
                    ),
                    _buildModernStatCard(
                      label: 'Cancelled',
                      count: counts['cancelled'] ?? 0,
                      color: AppColors.error,
                      icon: CupertinoIcons.xmark_circle_fill,
                      onTap: () {
                         Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => AllTripsPage(
                              token: widget.token,
                              status: kTripStatusCancelled,
                              title: 'Cancelled Trips',
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // 5. Tools / Extras Section
                Text(
                  'Tools',
                  style: AppTextStyles.h3,
                ),
                const SizedBox(height: 16),

                _buildToolTile(
                  title: 'Payment Details',
                  subtitle: 'Manage cards & bank info',
                  icon: CupertinoIcons.creditcard_fill,
                  color: Colors.purple,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) =>
                            PaymentDetailsPage(token: widget.token)),
                  ),
                ),
                const SizedBox(height: 12),
                _buildToolTile(
                  title: 'Overlay Permission',
                  subtitle: 'Allow drawing over other apps',
                  icon: CupertinoIcons.layers_alt_fill,
                  color: Colors.teal,
                  onTap: () async {
                    final nativeOverlay = NativeOverlayService();
                    final hasPermission =
                        await nativeOverlay.checkOverlayPermission();
                    if (!mounted) return;
                    ScaffoldMessenger.maybeOf(context)?.showSnackBar(
                      SnackBar(
                        content: Text(hasPermission
                            ? 'Permission already granted'
                            : 'Permission NOT granted'),
                        action: hasPermission
                            ? null
                            : SnackBarAction(
                                label: 'Request',
                                onPressed: () =>
                                    nativeOverlay.requestOverlayPermission(),
                              ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusSwitch() {
    return GestureDetector(
      onTap: () => _toggleOnline(!_online),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        width: 60,
        height: 34,
        decoration: BoxDecoration(
          color: _online ? AppColors.success : AppColors.border,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Stack(
          children: [
            AnimatedAlign(
              duration: const Duration(milliseconds: 300),
              alignment:
                  _online ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(
                  _online ? Icons.bolt : Icons.power_settings_new,
                  size: 16,
                  color: _online ? AppColors.success : AppColors.textTertiary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModernStatCard({
    required String label,
    required int count,
    required Color color,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(20),
      elevation: 0,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    count.toString(),
                    style: AppTextStyles.h2,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    label,
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.textTertiary),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildToolTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AppTextStyles.label.copyWith(fontSize: 16),
                    ),
                    Text(
                      subtitle,
                      style: AppTextStyles.bodySmall,
                    ),
                  ],
                ),
              ),
              Icon(CupertinoIcons.chevron_right,
                  size: 16, color: AppColors.textTertiary),
            ],
          ),
        ),
      ),
    );
  }
}
