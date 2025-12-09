import 'package:shared/shared.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

// Re-export ApiResult from shared for backward compatibility
export 'package:shared/shared.dart' show ApiResult;

// Razorpay key from environment
const String kRazorpayKey = String.fromEnvironment(
  'RAZORPAY_KEY',
  defaultValue: '',
);

// Base URL constant for backward compatibility
const String kApiBaseUrl = ApiConfig.baseUrl;

/// Type alias for backward compatibility - use DriverApiClient for new code
typedef ApiClient = DriverApiClient;

/// Global helper function for transforming image URLs (for backward compatibility)
String transformImageUrl(String? url) => ApiConfig.transformImageUrl(url);

/// Driver API client extending shared base client
class DriverApiClient extends BaseApiClient {
  DriverApiClient({super.baseUrl});

  // Auth endpoints
  Future<ApiResult> getAccessToken({required String token}) {
    return get('/app/auth/access-token', token: token);
  }

  Future<ApiResult> getDriverStatus({
    required String token,
    required String driverId,
  }) {
    return get('/app/auth/status/$driverId', token: token);
  }

  Future<ApiResult> sendLoginOtp({
    required String phone,
    String type = 'send',
  }) async {
    return post(
      '/app/auth/login/$type',
      {'phone': phone},
      allowedStatus: {200, 404},
    );
  }

  Future<ApiResult> verifyLoginOtp({
    required String phone,
    required String otp,
    required String smsToken,
    String? driverId,
    String type = 'verify',
  }) async {
    final body = <String, dynamic>{
      'phone': phone,
      'otp': otp,
      'smsToken': smsToken,
    };
    if (driverId != null) body['driverId'] = driverId;
    return post(
      '/app/auth/login/$type',
      body,
      allowedStatus: {200, 401, 404},
    );
  }

  Future<ApiResult> sendSignupOtp({
    required String phone,
    required String name,
    required String email,
    String type = 'send',
  }) async {
    return post(
      '/app/auth/signup-otp/$type',
      {'phoneNo': phone, 'name': name, 'email': email},
      allowedStatus: {200, 404},
    );
  }

  Future<ApiResult> verifySignupOtp({
    required String phone,
    required String otp,
    required String smsToken,
    String? name,
    String? email,
    String type = 'verify',
  }) async {
    final body = <String, dynamic>{
      'phone': phone,
      'otp': otp,
      'smsToken': smsToken,
    };
    if (name != null) body['name'] = name;
    if (email != null) body['email'] = email;
    return post(
      '/app/auth/signup-otp/$type',
      body,
      allowedStatus: {200, 401, 404},
    );
  }

  Future<ApiResult> signupStep ({
    required String step,
    required Map<String, dynamic> data,
    String? token,
  }) {
    return post('/app/auth/signup/$step', data, token: token);
  }

  // Driver endpoints
  Future<Map<String, dynamic>> fetchDriverDetails({
    required String token,
  }) async {
    final result = await get('/app/driver/get-details', token: token);
    return result.body;
  }

  Future<Map<String, dynamic>> fetchAdminDetails({
    required String token,
  }) async {
    final result = await get('/app/driver/admin-get-details', token: token);
    return result.body;
  }

  Future<ApiResult> updateFCMToken({
    required String token,
    required String fcmToken,
  }) {
    return post('/app/driver/fcm-token', {'token': fcmToken}, token: token);
  }

  Future<ApiResult> updateLocation({
    required String token,
    required double latitude,
    required double longitude,
  }) {
    return post('/app/driver/location', {
      'latitude': latitude,
      'longitude': longitude,
    }, token: token);
  }

  // KYC / Profile endpoints
  Future<ApiResult> updatePersonalInfo({
    required String token,
    required Map<String, dynamic> data,
  }) {
    return put('/app/driver/personal-info', data, token: token);
  }

  Future<ApiResult> updatePersonalDocuments({
    required String token,
    required Map<String, dynamic> data,
  }) {
    return put('/app/driver/personal-documents', data, token: token);
  }

  Future<ApiResult> uploadImage({
    required String token,
    required String filePath,
    required String type,
    String? vehicleId,
  }) async {
    final fields = <String, String>{'type': type};
    if (vehicleId != null && vehicleId.isNotEmpty) {
      fields['vehicleId'] = vehicleId;
    }
    return uploadFile(
      path: '/app/image-upload',
      token: token,
      filePath: filePath,
      fileFieldName: 'file',
      fields: fields,
    );
  }

  // Payment Details
  Future<ApiResult> getPaymentDetailsList({required String token}) {
    return get('/app/driver/payment-details', token: token);
  }

  Future<ApiResult> getPaymentDetail({
    required String token,
    required String paymentId,
  }) {
    return get('/app/driver/payment-details/$paymentId', token: token);
  }

  Future<ApiResult> createPaymentDetails({
    required String token,
    required Map<String, dynamic> data,
  }) {
    return post('/app/driver/payment-details', data, token: token);
  }

  Future<ApiResult> updatePaymentDetails({
    required String token,
    required String paymentId,
    required Map<String, dynamic> data,
  }) {
    return put('/app/driver/payment-details/$paymentId', data, token: token);
  }

  Future<ApiResult> togglePaymentMethod({
    required String token,
    required String paymentId,
    required String type,
  }) {
    return patch('/app/driver/payment-details/$paymentId/$type', {}, token: token);
  }

  Future<Map<String, dynamic>> getConfigKeys({
    required String token,
  }) async {
    final result = await get('/app/config/keys', token: token);
    return result.body;
  }

  // Online/Offline status
  Future<Map<String, dynamic>> updateOnlineStatus({
    required String token,
    required bool isOnline,
  }) async {
    final resp = await http.put(
      Uri.parse('$baseUrl/app/driver/online-status'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'isOnline': isOnline}),
    );
    return jsonDecode(resp.body) as Map<String, dynamic>;
  }

  // Wallet endpoints
  Future<Map<String, dynamic>> fetchWallet({
    required String token,
  }) async {
    final result = await get('/app/wallet/', token: token);
    return result.body;
  }

  Future<ApiResult> getTransactionHistory({
    required String token,
    int page = 1,
    int limit = 20,
  }) {
    return get('/app/wallet/transactions',
      token: token,
      queryParams: {'page': page.toString(), 'limit': limit.toString()},
    );
  }

  Future<ApiResult> createPaymentOrder({
    required String token,
    required double amount,
  }) {
    return post('/app/wallet/payment/order', {'amount': amount}, token: token);
  }

  /// Alias for createPaymentOrder (backward compatibility)
  Future<ApiResult> createWalletPaymentOrder({
    required String token,
    required double amount,
  }) {
    return createPaymentOrder(token: token, amount: amount);
  }

  /// Fetch wallet transaction history
  Future<ApiResult> fetchWalletHistory({
    required String token,
    int limit = 20,
    int offset = 0,
  }) {
    return get('/app/wallet/history',
      token: token,
      queryParams: {'limit': limit.toString(), 'offset': offset.toString()},
    );
  }

  Future<ApiResult> verifyPayment({
    required String token,
    required String orderId,
    required String paymentId,
    required String signature,
  }) {
    return post('/app/wallet/payment/verify', {
      'orderId': orderId,
      'paymentId': paymentId,
      'signature': signature,
    }, token: token);
  }

  /// Alias for verifyPayment (backward compatibility)
  Future<ApiResult> verifyWalletPayment({
    required String token,
    required String orderId,
    required String paymentId,
    required String signature,
  }) {
    return verifyPayment(
      token: token,
      orderId: orderId,
      paymentId: paymentId,
      signature: signature,
    );
  }

  Future<ApiResult> getPayoutRequests({
    required String token,
  }) {
    return get('/app/wallet/payout-requests', token: token);
  }

  Future<ApiResult> requestPayout({
    required String token,
    required double amount,
    required String type,
    required Map<String, dynamic> bankDetails,
  }) {
    return post('/app/wallet/request/$type', {
      'amount': amount,
      'bankDetails': bankDetails,
    }, token: token);
  }

  // Vehicle endpoints
  Future<ApiResult> getDriverVehicles({required String token}) {
    return get('/app/vehicle', token: token);
  }

  Future<ApiResult> getVehicleTypes({required String token}) {
    return get('/app/vehicle/types', token: token);
  }

  Future<ApiResult> getVehicleList({required String token}) {
    return get('/app/vehicle/list', token: token);
  }

  Future<ApiResult> uploadDocument({
    required String token,
    required String filePath,
    required String documentType,
  }) {
    return uploadFile(
      path: '/app/driver/upload',
      token: token,
      filePath: filePath,
      fileFieldName: 'file',
      fields: {'type': documentType},
    );
  }

  Future<ApiResult> createVehicle({
    required String token,
    required Map<String, dynamic> data,
  }) {
    return post('/app/vehicle', data, token: token);
  }

  /// Alias for createVehicle (backward compatibility)
  Future<ApiResult> addVehicle({
    required String token,
    required Map<String, dynamic> data,
  }) {
    return createVehicle(token: token, data: data);
  }

  Future<ApiResult> updateVehicle({
    required String token,
    required String vehicleId,
    required Map<String, dynamic> data,
  }) {
    return put('/app/vehicle/$vehicleId', data, token: token);
  }

  /// Alias for updateVehicle (backward compatibility for KYC document updates)
  Future<ApiResult> updateVehicleDocuments({
    required String token,
    required String vehicleId,
    required Map<String, dynamic> data,
  }) {
    return updateVehicle(token: token, vehicleId: vehicleId, data: data);
  }

  Future<ApiResult> deleteVehicle({
    required String token,
    required String vehicleId,
  }) {
    return delete('/app/vehicle/$vehicleId', {}, token: token);
  }

  Future<ApiResult> uploadVehicleDocument({
    required String token,
    required String vehicleId,
    required String filePath,
    required String documentType,
  }) {
    return uploadFile(
      path: '/app/vehicle/$vehicleId/upload',
      token: token,
      filePath: filePath,
      fileFieldName: 'file',
      fields: {'type': documentType},
    );
  }

  Future<ApiResult> submitKYC({required String token}) {
    return post('/app/driver/submit-kyc', {}, token: token);
  }

  // Booking endpoints
  Future<Map<String, dynamic>> fetchBookingCounts({
    required String token,
  }) async {
    final result = await get('/app/booking/counts', token: token);
    return result.body;
  }

  Future<ApiResult> getAllBookings({
    required String token,
    int page = 1,
    int limit = 10,
  }) {
    return get('/app/booking/all',
      token: token,
      queryParams: {'page': page.toString(), 'limit': limit.toString()},
    );
  }

  Future<ApiResult> getBookingsByStatus({
    required String token,
    required String status,
    int? page,
    int? limit, // null means no limit - get all bookings
  }) {
    final queryParams = <String, String>{
      'status': status,
    };
    
    // Only add pagination params if explicitly provided
    // If not provided, backend will return all bookings (no limit)
    if (page != null) {
      queryParams['page'] = page.toString();
    }
    if (limit != null && limit > 0) {
      queryParams['limit'] = limit.toString();
    }
    
    return get('/app/booking/specific',
      token: token,
      queryParams: queryParams,
    );
  }

  Future<ApiResult> acceptTrip({
    required String token,
    required String tripId,
  }) {
    // Accept booking endpoint (converts booking to trip when accepted)
    return post('/app/booking/accept/$tripId', {}, token: token);
  }

  Future<ApiResult> sendOtp({
    required String token,
    required String tripId,
    required String type,
  }) {
    return post('/app/trip/send-otp/$type/$tripId', {}, token: token);
  }

  /// Alias for sendOtp (backward compatibility)
  Future<ApiResult> sendTripOtp({
    required String token,
    required String tripId,
    required String type,
  }) {
    return sendOtp(token: token, tripId: tripId, type: type);
  }

  Future<ApiResult> startTrip({
    required String token,
    required String tripId,
    required String otp,
    required double startOdometer,
  }) {
    final Map<String, dynamic> body = {
      'otp': otp,
      'startOdometer': startOdometer,
    };
    return post('/app/trip/start/$tripId', body, token: token);
  }

  Future<ApiResult> endTrip({
    required String token,
    required String tripId,
    String? endOtp,
    double? distance,
    int? duration,
    required double endOdometer,
  }) {
    final Map<String, dynamic> body = {
      'endOdometer': endOdometer,
    };
    if (endOtp != null) body['endOtp'] = endOtp;
    if (distance != null) body['distance'] = distance;
    if (duration != null) body['duration'] = duration;
    return post('/app/trip/end/$tripId', body, token: token);
  }

  Future<ApiResult> getTripOtp({
    required String token,
    required String tripId,
  }) {
    return get('/app/trip/otp/$tripId', token: token);
  }

  Future<ApiResult> completeTrip({
    required String token,
    required String tripId,
    double? fare,
    double? tollCharges,
    double? parkingCharges,
    double? waitingCharges,
    double? hillCharge,
    double? tollCharge,
    double? petCharge,
    double? permitCharge,
    double? parkingCharge,
    double? waitingCharge,
  }) {
    final Map<String, dynamic> body = {'fare': fare};
    if (tollCharges != null) body['tollCharges'] = tollCharges;
    if (parkingCharges != null) body['parkingCharges'] = parkingCharges;
    if (waitingCharges != null) body['waitingCharges'] = waitingCharges;
    // Alternative field names used by some callers
    if (hillCharge != null) body['hillCharge'] = hillCharge;
    if (tollCharge != null) body['tollCharge'] = tollCharge;
    if (petCharge != null) body['petCharge'] = petCharge;
    if (permitCharge != null) body['permitCharge'] = permitCharge;
    if (parkingCharge != null) body['parkingCharge'] = parkingCharge;
    if (waitingCharge != null) body['waitingCharge'] = waitingCharge;
    return post('/app/trip/completed/$tripId', body, token: token);
  }

  Future<ApiResult> cancelTrip({
    required String token,
    required String tripId,
    required String reason,
    String? type,
  }) {
    final Map<String, dynamic> body = {'reason': reason};
    if (type != null && type.isNotEmpty) body['type'] = type;
    return post('/app/trip/cancel/$tripId', body, token: token);
  }

  Future<ApiResult> getTripDetails({
    required String token,
    required String tripId,
  }) {
    return get('/app/trip/$tripId', token: token);
  }

  Future<ApiResult> getTripSummary({
    required String token,
    required String tripId,
  }) {
    return get('/app/trip/summary/$tripId', token: token);
  }

  Future<ApiResult> getAllTrips({
    required String token,
    int page = 1,
    int limit = 10,
  }) {
    return get('/app/trip/all',
      token: token,
      queryParams: {'page': page.toString(), 'limit': limit.toString()},
    );
  }

  Future<ApiResult> verifyTripPayment({
    required String token,
    required String tripId,
    required String orderId,
    required String paymentId,
    required String signature,
  }) {
    return post('/app/trip/payment/verify/$tripId', {
      'orderId': orderId,
      'paymentId': paymentId,
      'signature': signature,
    }, token: token);
  }

  // Analytics & Earnings
  Future<ApiResult> getAnalytics({
    required String token,
    String? startDate,
    String? endDate,
  }) {
    return get('/app/driver/analytics',
      token: token,
      queryParams: {
        if (startDate != null) 'startDate': startDate,
        if (endDate != null) 'endDate': endDate,
      },
    );
  }

  /// Alias for getAnalytics (backward compatibility)
  Future<ApiResult> getDriverAnalytics({required String token}) {
    return getAnalytics(token: token);
  }

  /// Get earnings graph data (alias for getAnalytics with period)
  Future<ApiResult> getEarningsGraph({
    required String token,
    String period = 'weekly',
  }) {
    return get('/app/driver/analytics',
      token: token,
      queryParams: {'period': period},
    );
  }

  Future<ApiResult> getEarnings({
    required String token,
    String? startDate,
    String? endDate,
  }) {
    return get('/app/driver/earnings',
      token: token,
      queryParams: {
        if (startDate != null) 'startDate': startDate,
        if (endDate != null) 'endDate': endDate,
      },
    );
  }

  Future<ApiResult> getTripCounts({required String token}) {
    return get('/app/trip/counts', token: token);
  }

  /// Alias for booking counts (backward compatibility)
  Future<ApiResult> fetchTripCounts({required String token}) {
    return get('/app/booking/counts', token: token);
  }

  Future<ApiResult> getMonthlyEarnings({required String token}) {
    return get('/app/driver/monthly-earnings', token: token);
  }

  /// Accept or reject a booking
  Future<ApiResult> respondBooking({
    required String token,
    required String bookingId,
    required bool accept,
  }) {
    return post('/app/booking/accept/$bookingId', {
      'accept': accept,
    }, token: token);
  }

  // Common endpoints
  Future<ApiResult> getStates({required String token}) {
    return get('/app/common/state/all', token: token);
  }

  Future<ApiResult> getCities({
    required String token,
    required String stateId,
  }) {
    return get('/app/common/city/all/$stateId', token: token);
  }

  Future<ApiResult> getChargesByCity({
    required String token,
    required String cityId,
  }) {
    return get('/app/common/charges/$cityId', token: token);
  }

  // Booking endpoints
  Future<ApiResult> getBookingDetails({
    required String token,
    required String bookingId,
  }) {
    return get('/app/booking/$bookingId', token: token);
  }

  Future<ApiResult> acceptBooking({
    required String token,
    required String bookingId,
    required String driverId,
    required String vehicleId,
  }) {
    return post('/app/booking/accept/$bookingId', {
      'driverId': driverId,
      'vehicleId': vehicleId,
    }, token: token);
  }

  Future<ApiResult> rejectBooking({
    required String token,
    required String bookingId,
    required String reason,
  }) {
    return post('/app/booking/reject/$bookingId', {
      'reason': reason,
    }, token: token);
  }

  // Notifications
  Future<ApiResult> getNotifications({
    required String token,
    int page = 1,
    int limit = 20,
  }) {
    return get('/app/notification',
      token: token,
      queryParams: {'page': page.toString(), 'limit': limit.toString()},
    );
  }

  /// Alias for getNotifications (backward compatibility)
  Future<ApiResult> getAllNotifications({required String token}) {
    return getNotifications(token: token);
  }

  Future<ApiResult> getNotificationSettings({required String token}) {
    return get('/app/notification/settings', token: token);
  }

  Future<ApiResult> updateNotificationSettings({
    required String token,
    required Map<String, dynamic> settings,
  }) {
    return put('/app/notification/settings', settings, token: token);
  }

  Future<ApiResult> markNotificationAsRead({
    required String token,
    required String notificationId,
  }) {
    return patch('/app/notification/read/$notificationId', {}, token: token);
  }

  Future<ApiResult> markAllNotificationsRead({required String token}) {
    return put('/app/notification/read-all', {}, token: token);
  }

  Future<ApiResult> deleteNotifications({
    required String token,
    required List<String> notificationIds,
  }) {
    return delete('/app/notification/delete', {
      'notificationIds': notificationIds,
    }, token: token);
  }

  /// Helper: Transform image URL (from shared ApiConfig)
  String transformImageUrl(String? url) => ApiConfig.transformImageUrl(url);
}
