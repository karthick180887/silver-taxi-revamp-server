import 'package:shared/shared.dart';

/// Vendor API client that wires every available vendor app endpoint.
///
/// All methods return `ApiResult` from the shared package for consistent
/// success/error handling.
class VendorApiClient extends BaseApiClient {
  VendorApiClient({super.baseUrl});

  // =========================
  // Auth
  // =========================

  /// POST /vendor/auth/login
  Future<ApiResult> login({
    String? email,
    String? phone,
    required String password,
  }) {
    return post('/vendor/auth/login', {
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      'password': password,
    });
  }

  // =========================
  // Vendor profile & config
  // =========================

  /// GET /vendor/profile
  Future<ApiResult> fetchProfile({required String token}) {
    return get('/vendor/profile', token: token);
  }

  /// GET /vendor/transactions
  Future<ApiResult> fetchTransactions({required String token}) {
    return get('/vendor/transactions', token: token);
  }

  /// POST /vendor/fcm-token
  Future<ApiResult> updateFcmToken({
    required String token,
    required String fcmToken,
  }) {
    return post('/vendor/fcm-token', {'fcmToken': fcmToken}, token: token);
  }

  /// GET /vendor/config-keys
  Future<ApiResult> getConfigKeys({required String token}) {
    return get('/vendor/config-keys', token: token);
  }

  /// GET /vendor/version/get
  Future<ApiResult> getVersion({required String token}) {
    return get('/vendor/version/get', token: token);
  }

  // =========================
  // Payment details
  // =========================

  /// POST /vendor/payment-details
  Future<ApiResult> createPaymentDetails({
    required String token,
    required Map<String, dynamic> data,
  }) {
    return post('/vendor/payment-details', data, token: token);
  }

  /// GET /vendor/payment-details
  Future<ApiResult> listPaymentDetails({required String token}) {
    return get('/vendor/payment-details', token: token);
  }

  /// GET /vendor/payment-details/:id
  Future<ApiResult> getPaymentDetail({
    required String token,
    required String id,
  }) {
    return get('/vendor/payment-details/$id', token: token);
  }

  /// PUT /vendor/payment-details/:id
  Future<ApiResult> updatePaymentDetail({
    required String token,
    required String id,
    required Map<String, dynamic> data,
  }) {
    return put('/vendor/payment-details/$id', data, token: token);
  }

  /// PATCH /vendor/payment-details/:id/:type
  Future<ApiResult> togglePaymentDetail({
    required String token,
    required String id,
    required String type,
  }) {
    return patch('/vendor/payment-details/$id/$type', {}, token: token);
  }

  // =========================
  // Bookings
  // =========================

  /// GET /vendor/bookings
  Future<ApiResult> getAllBookings({
    required String token,
    String? adminId,
    String? vendorId,
  }) {
    final params = <String, String>{};
    if (adminId != null) params['adminId'] = adminId;
    if (vendorId != null) params['vendorId'] = vendorId;
    return get('/vendor/bookings', token: token, queryParams: params);
  }

  /// GET /vendor/bookings/specific
  Future<ApiResult> getSpecificBookings({
    required String token,
    Map<String, String>? queryParams,
    String? adminId,
    String? vendorId,
  }) {
    final params = Map<String, String>.from(queryParams ?? {});
    if (adminId != null) params['adminId'] = adminId;
    if (vendorId != null) params['vendorId'] = vendorId;
    return get('/vendor/bookings/specific', token: token, queryParams: params);
  }

  /// GET /vendor/bookings/counts
  Future<ApiResult> getBookingCounts({
    required String token,
    String? adminId,
    String? vendorId,
  }) {
    final params = <String, String>{};
    if (adminId != null) params['adminId'] = adminId;
    if (vendorId != null) params['vendorId'] = vendorId;
    return get('/vendor/bookings/counts', token: token, queryParams: params);
  }

  /// GET /vendor/bookings/drivers
  Future<ApiResult> getDrivers({
    required String token,
    String? adminId,
    String? vendorId,
  }) {
    final params = <String, String>{};
    if (adminId != null) params['adminId'] = adminId;
    if (vendorId != null) params['vendorId'] = vendorId;
    return get('/vendor/bookings/drivers', token: token, queryParams: params);
  }

  /// GET /vendor/bookings/drivers-location
  Future<ApiResult> getDriversWithLocation({required String token}) {
    return get('/vendor/bookings/drivers-location', token: token);
  }

  /// GET /vendor/bookings/driver/:phone
  Future<ApiResult> getDriverByPhone({
    required String token,
    required String phone,
  }) {
    return get('/vendor/bookings/driver/$phone', token: token);
  }

  /// GET /vendor/bookings/vehicle-types
  Future<ApiResult> getVehicleTypes({required String token}) {
    return get('/vendor/bookings/vehicle-types', token: token);
  }

  /// GET /vendor/bookings/hourly-packages
  Future<ApiResult> getHourlyPackages({required String token}) {
    return get('/vendor/bookings/hourly-packages', token: token);
  }

  /// POST /vendor/bookings
  Future<ApiResult> createBooking({
    required String token,
    required Map<String, dynamic> data,
  }) {
    return post('/vendor/bookings', data, token: token);
  }

  /// POST /vendor/bookings/:id/assign-all-drivers
  Future<ApiResult> assignAllDrivers({
    required String token,
    required String bookingId,
  }) {
    return post('/vendor/bookings/$bookingId/assign-all-drivers', {}, token: token);
  }

  /// GET /vendor/bookings/:id
  Future<ApiResult> getBookingById({
    required String token,
    required String bookingId,
  }) {
    return get('/vendor/bookings/$bookingId', token: token);
  }

  /// POST /vendor/bookings/:id/cancel
  Future<ApiResult> cancelBooking({
    required String token,
    required String bookingId,
    Map<String, dynamic>? data,
  }) {
    return post('/vendor/bookings/$bookingId/cancel', data ?? {}, token: token);
  }

  /// PUT /vendor/bookings/:id
  Future<ApiResult> updateBooking({
    required String token,
    required String bookingId,
    required Map<String, dynamic> data,
  }) {
    return put('/vendor/bookings/$bookingId', data, token: token);
  }

  /// DELETE /vendor/bookings/:id
  Future<ApiResult> deleteBooking({
    required String token,
    required String bookingId,
  }) {
    return delete('/vendor/bookings/$bookingId', {}, token: token);
  }

  /// POST /vendor/bookings/assign-driver
  Future<ApiResult> assignDriver({
    required String token,
    required Map<String, dynamic> data,
  }) {
    return post('/vendor/bookings/assign-driver', data, token: token);
  }

  /// POST /vendor/bookings/toggle-changes/:id
  Future<ApiResult> toggleChanges({
    required String token,
    required String bookingId,
  }) {
    return post('/vendor/bookings/toggle-changes/$bookingId', {}, token: token);
  }

  // =========================
  // Bookings V2
  // =========================

  /// GET /vendor/v2/bookings
  Future<ApiResult> getAllBookingsV2({
    required String token,
    Map<String, String>? queryParams,
  }) {
    return get('/vendor/v2/bookings', token: token, queryParams: queryParams);
  }

  /// GET /vendor/v2/bookings/specific
  Future<ApiResult> getSpecificBookingsV2({
    required String token,
    Map<String, String>? queryParams,
  }) {
    return get('/vendor/v2/bookings/specific', token: token, queryParams: queryParams);
  }

  /// GET /vendor/v2/bookings/:id
  Future<ApiResult> getBookingByIdV2({
    required String token,
    required String bookingId,
  }) {
    return get('/vendor/v2/bookings/$bookingId', token: token);
  }

  // =========================
  // Estimation
  // =========================

  /// POST /vendor/estimation
  Future<ApiResult> estimateFare({
    required String token,
    required Map<String, dynamic> data,
  }) {
    return post('/vendor/estimation', data, token: token);
  }
}

