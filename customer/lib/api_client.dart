import 'dart:convert';
import 'package:http/http.dart' as http;

/// Change this to a host reachable from your device/emulator
const String kApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://192.168.1.100:30060',
);

/// Admin Id used for OTP flows (required by backend when no token yet)
const String kAdminId = String.fromEnvironment(
  'ADMIN_ID',
  defaultValue: 'admin-1',
);

class ApiResult {
  final int statusCode;
  final Map<String, dynamic> body;
  final bool success;

  ApiResult({
    required this.statusCode,
    required this.body,
    required this.success,
  });
}

class CustomerApiClient {
  CustomerApiClient({required this.baseUrl});

  final String baseUrl;

  // ============================================
  // Authentication
  // ============================================

  Future<ApiResult> sendLoginOtp({required String phone}) {
    return _post(
      '/customer/auth/login/send',
      {
        'phone': phone,
        'adminId': kAdminId,
      },
      allowedStatus: {200, 400, 401, 404},
    );
  }

  Future<ApiResult> verifyLoginOtp({
    required String phone,
    required String otp,
    required String smsToken,
  }) {
    return _post(
      '/customer/auth/login/verify',
      {
        'phone': phone,
        'otp': otp,
        'smsToken': smsToken,
        'adminId': kAdminId,
      },
      allowedStatus: {200, 400, 401, 404},
    );
  }

  Future<ApiResult> sendSignupOtp({
    required String phone,
    required String name,
    String? email,
  }) {
    return _post(
      '/customer/auth/signup-otp/send',
      {
        'phoneNo': phone,
        'name': name,
        if (email != null) 'email': email,
        'adminId': kAdminId,
      },
      allowedStatus: {200, 400, 401, 404},
    );
  }

  Future<ApiResult> verifySignupOtp({
    required String phone,
    required String otp,
    required String smsToken,
    String? name,
    String? email,
  }) {
    return _post(
      '/customer/auth/signup-otp/verify',
      {
        'phoneNo': phone,
        'otp': otp,
        'smsToken': smsToken,
        if (name != null) 'name': name,
        if (email != null) 'email': email,
        'adminId': kAdminId,
      },
      allowedStatus: {200, 400, 401, 404},
    );
  }

  // ============================================
  // Profile & common data
  // ============================================

  Future<ApiResult> getCustomerDetails({required String token}) {
    return _get('/customer/get-details', token: token);
  }

  Future<ApiResult> getAdminDetails({required String token}) {
    return _get('/customer/admin-details', token: token);
  }

  Future<ApiResult> getServices({required String token}) {
    return _get('/customer/services', token: token);
  }

  Future<ApiResult> getTopDestinations({
    required String token,
    required String fromCity,
  }) {
    return _get(
      '/customer/get-destinations',
      token: token,
      queryParams: {'fromCity': fromCity},
      allowedStatus: {200, 404},
    );
  }

  Future<ApiResult> updateCustomerProfile({
    required String token,
    String? name,
    String? email,
    String? phone,
    String? gender,
    DateTime? dob,
    String? otp,
    String? smsToken,
  }) {
    final data = <String, dynamic>{
      if (name != null) 'name': name,
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      if (gender != null) 'gender': gender,
      if (dob != null) 'dob': dob.toIso8601String(),
      if (otp != null) 'otp': otp,
      if (smsToken != null) 'smsToken': smsToken,
    };

    return _post(
      '/customer/profile-update',
      data,
      token: token,
      allowedStatus: {200, 400, 404},
    );
  }

  Future<ApiResult> updateFcmToken({
    required String token,
    required String fcmToken,
  }) {
    return _put(
      '/customer/fcm-update',
      {'fcmToken': fcmToken},
      token: token,
      allowedStatus: {200, 400},
    );
  }

  Future<ApiResult> getConfigKeys({required String token}) {
    return _get('/customer/config-keys', token: token);
  }

  // ============================================
  // Wallet
  // ============================================

  Future<ApiResult> getCustomerWallet({required String token}) {
    return _get('/customer/wallet', token: token);
  }

  Future<ApiResult> getWalletTransactions({
    required String token,
    int? limit,
    int? offset,
  }) {
    final queryParams = <String, String>{};
    if (limit != null) queryParams['limit'] = '$limit';
    if (offset != null) queryParams['offset'] = '$offset';

    return _get(
      '/customer/wallet/history',
      token: token,
      queryParams: queryParams,
      allowedStatus: {200, 404},
    );
  }

  // ============================================
  // Offers & promo
  // ============================================

  Future<ApiResult> getOffers({required String token}) {
    return _get('/customer/offers/get', token: token, allowedStatus: {200, 404});
  }

  Future<ApiResult> validatePromoCode({
    required String token,
    required String code,
  }) {
    return _post(
      '/customer/promo-codes/validate',
      {'code': code},
      token: token,
      allowedStatus: {200, 400},
    );
  }

  // ============================================
  // Bookings & enquiry
  // ============================================

  Future<ApiResult> getBookingsByStatus({
    required String token,
    String status = 'all',
  }) {
    return _get(
      '/customer/booking/specific-bookings',
      token: token,
      queryParams: {'status': status},
      allowedStatus: {200, 404},
    );
  }

  Future<ApiResult> getBooking({
    required String token,
    required String bookingId,
  }) {
    return _get(
      '/customer/booking/single-booking/$bookingId',
      token: token,
      allowedStatus: {200, 404},
    );
  }

  Future<ApiResult> cancelBooking({
    required String token,
    required String bookingId,
  }) {
    return _put(
      '/customer/booking/cancel/$bookingId',
      {},
      token: token,
      allowedStatus: {200, 400},
    );
  }

  Future<ApiResult> getEstimation({
    required String token,
    required String pickUp,
    required String drop,
    required DateTime pickupDateTime,
    String? dropDate,
    List<String>? stops,
    required String serviceType,
  }) {
    return _post(
      '/customer/enquiry/get-estimation',
      {
        'pickUp': pickUp,
        'drop': drop,
        if (stops != null && stops.isNotEmpty) 'stops': stops,
        'pickupDateTime': pickupDateTime.toIso8601String(),
        if (dropDate != null) 'dropDate': dropDate,
        'serviceType': serviceType,
      },
      token: token,
      allowedStatus: {200, 400},
    );
  }

  Future<ApiResult> createBooking({
    required String token,
    required Map<String, dynamic> payload,
  }) {
    return _post(
      '/customer/booking/create',
      payload,
      token: token,
      allowedStatus: {200, 400},
    );
  }

  // ============================================
  // Helper Methods
  // ============================================

  Future<ApiResult> _get(
    String path, {
    String? token,
    Map<String, String>? queryParams,
    Set<int> allowedStatus = const {200},
  }) async {
    try {
      var uri = Uri.parse('$baseUrl$path');
      if (queryParams != null && queryParams.isNotEmpty) {
        uri = uri.replace(queryParameters: queryParams);
      }

      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final resp = await http.get(uri, headers: headers);

      Map<String, dynamic> body;
      try {
        body = jsonDecode(resp.body) as Map<String, dynamic>;
      } catch (_) {
        final errorPreview =
            resp.body.length > 200 ? resp.body.substring(0, 200) : resp.body;
        body = {
          'success': false,
          'message': 'Server returned non-JSON response',
          'error': 'Status ${resp.statusCode}: $errorPreview',
          'statusCode': resp.statusCode,
          'url': uri.toString(),
        };
      }

      return ApiResult(
        statusCode: resp.statusCode,
        body: body,
        success: allowedStatus.contains(resp.statusCode) || resp.statusCode == 200,
      );
    } catch (e) {
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': 'Network error',
          'error': e.toString(),
        },
        success: false,
      );
    }
  }

  Future<ApiResult> _post(
    String path,
    Map<String, dynamic> data, {
    String? token,
    Set<int> allowedStatus = const {200, 201},
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$path');
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final resp = await http.post(
        uri,
        headers: headers,
        body: jsonEncode(data),
      );

      Map<String, dynamic> body;
      try {
        body = jsonDecode(resp.body) as Map<String, dynamic>;
      } catch (_) {
        final errorPreview =
            resp.body.length > 200 ? resp.body.substring(0, 200) : resp.body;
        body = {
          'success': false,
          'message': 'Server returned non-JSON response',
          'error': 'Status ${resp.statusCode}: $errorPreview',
          'statusCode': resp.statusCode,
          'url': uri.toString(),
        };
      }

      return ApiResult(
        statusCode: resp.statusCode,
        body: body,
        success: allowedStatus.contains(resp.statusCode) || resp.statusCode == 200,
      );
    } catch (e) {
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': 'Network error',
          'error': e.toString(),
        },
        success: false,
      );
    }
  }

  Future<ApiResult> _put(
    String path,
    Map<String, dynamic> data, {
    String? token,
    Set<int> allowedStatus = const {200},
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$path');
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final resp = await http.put(
        uri,
        headers: headers,
        body: jsonEncode(data),
      );

      Map<String, dynamic> body;
      try {
        body = jsonDecode(resp.body) as Map<String, dynamic>;
      } catch (_) {
        final errorPreview =
            resp.body.length > 200 ? resp.body.substring(0, 200) : resp.body;
        body = {
          'success': false,
          'message': 'Server returned non-JSON response',
          'error': 'Status ${resp.statusCode}: $errorPreview',
          'statusCode': resp.statusCode,
          'url': uri.toString(),
        };
      }

      return ApiResult(
        statusCode: resp.statusCode,
        body: body,
        success: allowedStatus.contains(resp.statusCode) || resp.statusCode == 200,
      );
    } catch (e) {
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': 'Network error',
          'error': e.toString(),
        },
        success: false,
      );
    }
  }
}
import 'dart:convert';
import 'package:http/http.dart' as http;

// Change this to a host reachable from your device/emulator
const String kApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://192.168.1.100:30060',
);

class ApiResult {
  final int statusCode;
  final Map<String, dynamic> body;
  final bool success;

  ApiResult({
    required this.statusCode,
    required this.body,
    required this.success,
  });
}

class CustomerApiClient {
  CustomerApiClient({required this.baseUrl});

  final String baseUrl;

  // ============================================
  // Customer Authentication APIs
  // ============================================

  /// POST /customer/auth/login - Customer login (OTP-based)
  /// If OTP not provided, sends OTP. If OTP provided, verifies and logs in.
  Future<ApiResult> customerLogin({
    required String phone,
    String? otp,
  }) async {
    return _post(
      '/customer/auth/login',
      {
        'phone': phone,
        if (otp != null) 'otp': otp,
      },
      allowedStatus: {200, 400, 401, 404},
    );
  }

  /// POST /customer/auth/register - Customer registration (OTP-based)
  Future<ApiResult> customerRegister({
    required String phone,
    required String name,
    String? email,
    String? otp,
  }) async {
    return _post(
      '/customer/auth/register',
      {
        'phone': phone,
        'name': name,
        if (email != null) 'email': email,
        if (otp != null) 'otp': otp,
      },
      allowedStatus: {200, 400, 409},
    );
  }

  // ============================================
  // Customer Profile APIs
  // ============================================

  /// GET /customer/get-details - Get customer details
  Future<ApiResult> getCustomerDetails({
    required String token,
    String? customerId,
    String? adminId,
  }) async {
    final queryParams = <String, String>{};
    if (customerId != null) queryParams['customerId'] = customerId;
    if (adminId != null) queryParams['adminId'] = adminId;

    return _get(
      '/customer/get-details',
      token: token,
      queryParams: queryParams,
    );
  }

  /// PUT /customer/update-profile - Update customer profile
  Future<ApiResult> updateCustomerProfile({
    required String token,
    String? name,
    String? email,
    String? phone,
    String? gender,
    DateTime? dob,
  }) async {
    final data = <String, dynamic>{};
    if (name != null) data['name'] = name;
    if (email != null) data['email'] = email;
    if (phone != null) data['phone'] = phone;
    if (gender != null) data['gender'] = gender;
    if (dob != null) data['dob'] = dob.toIso8601String();

    return _put(
      '/customer/update-profile',
      data,
      token: token,
    );
  }

  // ============================================
  // Customer Wallet APIs
  // ============================================

  /// GET /customer/wallet - Get customer wallet
  Future<ApiResult> getCustomerWallet({
    required String token,
    String? customerId,
    String? adminId,
  }) async {
    final queryParams = <String, String>{};
    if (customerId != null) queryParams['customerId'] = customerId;
    if (adminId != null) queryParams['adminId'] = adminId;

    return _get(
      '/customer/wallet',
      token: token,
      queryParams: queryParams,
    );
  }

  /// GET /customer/wallet/history - Get wallet transactions
  Future<ApiResult> getWalletTransactions({
    required String token,
    String? customerId,
    String? adminId,
    int? limit,
    int? offset,
  }) async {
    final queryParams = <String, String>{};
    if (customerId != null) queryParams['customerId'] = customerId;
    if (adminId != null) queryParams['adminId'] = adminId;
    if (limit != null) queryParams['limit'] = limit.toString();
    if (offset != null) queryParams['offset'] = offset.toString();

    return _get(
      '/customer/wallet/history',
      token: token,
      queryParams: queryParams,
    );
  }

  // ============================================
  // Customer Booking APIs
  // ============================================

  /// POST /customer/bookings - Create booking
  Future<ApiResult> createBooking({
    required String token,
    required Map<String, dynamic> pickupLocation,
    required Map<String, dynamic> dropLocation,
    required String vehicleTypeId,
    required double finalAmount,
    double? estimatedAmount,
    String? paymentMethod,
    String? tripType,
    DateTime? pickupDateTime,
    String? notes,
  }) async {
    final data = <String, dynamic>{
      'pickupLocation': pickupLocation,
      'dropLocation': dropLocation,
      'vehicleTypeId': vehicleTypeId,
      'finalAmount': finalAmount,
      if (estimatedAmount != null) 'estimatedAmount': estimatedAmount,
      if (paymentMethod != null) 'paymentMethod': paymentMethod,
      if (tripType != null) 'tripType': tripType,
      if (pickupDateTime != null) 'pickupDateTime': pickupDateTime.toIso8601String(),
      if (notes != null) 'notes': notes,
    };

    return _post(
      '/customer/bookings',
      data,
      token: token,
    );
  }

  /// GET /customer/bookings - Get customer bookings
  Future<ApiResult> getCustomerBookings({
    required String token,
    String? status,
    int? limit,
    int? offset,
  }) async {
    final queryParams = <String, String>{};
    if (status != null) queryParams['status'] = status;
    if (limit != null) queryParams['limit'] = limit.toString();
    if (offset != null) queryParams['offset'] = offset.toString();

    return _get(
      '/customer/bookings',
      token: token,
      queryParams: queryParams,
    );
  }

  // ============================================
  // Helper Methods
  // ============================================

  Future<ApiResult> _get(
    String path, {
    String? token,
    Map<String, String>? queryParams,
    Set<int> allowedStatus = const {200},
  }) async {
    try {
      var uri = Uri.parse('$baseUrl$path');
      if (queryParams != null && queryParams.isNotEmpty) {
        uri = uri.replace(queryParameters: queryParams);
      }

      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final resp = await http.get(uri, headers: headers);
      
      Map<String, dynamic> body;
      try {
        body = jsonDecode(resp.body) as Map<String, dynamic>;
      } catch (e) {
        // If response is not JSON (e.g., 404 HTML page), return error info
        final errorPreview = resp.body.length > 200 
            ? resp.body.substring(0, 200) 
            : resp.body;
        body = {
          'success': false,
          'message': 'Server returned non-JSON response',
          'error': 'Status ${resp.statusCode}: $errorPreview',
          'statusCode': resp.statusCode,
          'url': uri.toString(),
        };
        print('API Error: GET $uri -> Status ${resp.statusCode}');
        print('Response body: $errorPreview');
      }

      return ApiResult(
        statusCode: resp.statusCode,
        body: body,
        success: allowedStatus.contains(resp.statusCode) || resp.statusCode == 200,
      );
    } catch (e) {
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': 'Network error',
          'error': e.toString(),
        },
        success: false,
      );
    }
  }

  Future<ApiResult> _post(
    String path,
    Map<String, dynamic> data, {
    String? token,
    Set<int> allowedStatus = const {200, 201},
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$path');
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final resp = await http.post(
        uri,
        headers: headers,
        body: jsonEncode(data),
      );

      Map<String, dynamic> body;
      try {
        body = jsonDecode(resp.body) as Map<String, dynamic>;
      } catch (e) {
        // If response is not JSON (e.g., 404 HTML page), return error info
        final errorPreview = resp.body.length > 200 
            ? resp.body.substring(0, 200) 
            : resp.body;
        body = {
          'success': false,
          'message': 'Server returned non-JSON response',
          'error': 'Status ${resp.statusCode}: $errorPreview',
          'statusCode': resp.statusCode,
          'url': uri.toString(),
        };
        print('API Error: PUT $uri -> Status ${resp.statusCode}');
        print('Response body: $errorPreview');
      }

      return ApiResult(
        statusCode: resp.statusCode,
        body: body,
        success: allowedStatus.contains(resp.statusCode) || resp.statusCode == 200,
      );
    } catch (e) {
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': 'Network error',
          'error': e.toString(),
        },
        success: false,
      );
    }
  }

  Future<ApiResult> _put(
    String path,
    Map<String, dynamic> data, {
    String? token,
    Set<int> allowedStatus = const {200},
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    final resp = await http.put(
      uri,
      headers: headers,
      body: jsonEncode(data),
    );

    final body = jsonDecode(resp.body) as Map<String, dynamic>;

    return ApiResult(
      statusCode: resp.statusCode,
      body: body,
      success: allowedStatus.contains(resp.statusCode) || resp.statusCode == 200,
    );
  }
}

