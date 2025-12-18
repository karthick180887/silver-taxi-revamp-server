import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

// Change this to a host reachable from your device/emulator
const String kApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://api.cabigo.in', // Production URL
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

  /// POST /customer/auth/login/:type - Customer login (OTP-based)
  /// type: "send" to send OTP, "verify" to verify OTP and login
  Future<ApiResult> customerLogin({
    required String type, // "send" or "verify"
    required String adminId,
    String? phone,
    String? otp,
    String? smsToken, // Required for verify
    String? accessToken,
  }) async {
    if (type == 'send') {
      return _post(
        '/customer/auth/login/send',
        {
          'adminId': adminId,
          'phone': phone!,
        },
        allowedStatus: {200, 400, 404},
      );
    } else if (type == 'verify') {
      return _post(
        '/customer/auth/login/verify',
        {
          'adminId': adminId,
          if (otp != null) 'otp': otp,
          if (smsToken != null) 'smsToken': smsToken,
          if (accessToken != null) 'accessToken': accessToken,
          if (phone != null) 'phone': phone,
        },
        allowedStatus: {200, 400, 401},
      );
    } else if (type == 'sdk_login') {
      return _post(
        '/customer/auth/login/sdk_login',
        {
          'adminId': adminId,
          'phone': phone!,
        },
        allowedStatus: {200, 400, 404},
      );
    } else {
      throw ArgumentError('type must be "send", "verify" or "sdk_login"');
    }
  }

  /// POST /customer/auth/signup-otp/:type - Customer signup (OTP-based)
  /// type: "send" to send OTP, "verify" to verify OTP and signup
  Future<ApiResult> customerSignup({
    required String type, // "send" or "verify"
    required String adminId,
    String? phone,
    String? name,
    String? email,
    String? otp,
    String? smsToken, // Required for verify
    String? fcmToken,
    String? accessToken,
  }) async {
    if (type == 'send') {
      return _post(
        '/customer/auth/signup-otp/send',
        {
          'adminId': adminId,
          'phoneNo': phone!,
          'name': name!,
          if (email != null) 'email': email,
        },
        allowedStatus: {200, 400, 409},
      );
    } else if (type == 'verify') {
      return _post(
        '/customer/auth/signup-otp/verify',
        {
          'adminId': adminId,
          'phone': phone!,
          if (otp != null) 'otp': otp,
          if (smsToken != null) 'smsToken': smsToken,
          if (accessToken != null) 'accessToken': accessToken,
          'name': name!,
          if (email != null) 'email': email,
          if (fcmToken != null) 'fcmToken': fcmToken,
        },
        allowedStatus: {200, 400, 409},
      );
    } else {
      throw ArgumentError('type must be "send" or "verify"');
    }
  }

  /// POST /customer/auth/login - Customer login (Legacy endpoint for backward compatibility)
  Future<ApiResult> customerLoginLegacy({
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

  /// POST /customer/auth/register - Customer registration (Legacy endpoint for backward compatibility)
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


  /// PUT /customer/profile-update - Update customer profile
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

    return _post(
      '/customer/profile-update',
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
  // Customer Profile & Settings APIs
  // ============================================

  /// PUT /customer/fcm-update - Update FCM token
  Future<ApiResult> updateFCMToken({
    required String token,
    required String fcmToken,
  }) async {
    return _put(
      '/customer/fcm-update',
      {'fcmToken': fcmToken},
      token: token,
    );
  }

  /// GET /customer/get-destinations - Get top destinations
  Future<ApiResult> getTopDestinations({
    required String token,
  }) async {
    return _get(
      '/customer/get-destinations',
      token: token,
    );
  }

  /// GET /customer/admin-details - Get admin details
  Future<ApiResult> getAdminDetails({
    required String token,
    required String adminId,
  }) async {
    return _get(
      '/customer/admin-details',
      token: token,
      queryParams: {'adminId': adminId},
    );
  }

  // ============================================
  // Customer Booking APIs
  // ============================================

  /// POST /customer/booking/create - Create booking
  Future<ApiResult> createBooking({
    required String token,
    required Map<String, dynamic> pickupLocation,
    required Map<String, dynamic> dropLocation,
    required String vehicleTypeId,
    required num finalAmount,
    num? estimatedAmount,
    String? paymentMethod,
    String? tripType,
    DateTime? pickupDateTime,
    String? notes,
    String? phone,
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
      if (phone != null) 'phone': phone,
    };

    print('DEBUG: createBooking sending data: $data');

    return _post(
      '/customer/booking/create',
      data,
      token: token,
    );
  }

  /// GET /customer/booking/specific-bookings - Get bookings filtered by status
  Future<ApiResult> getSpecificBookings({
    required String token,
    required String status,
  }) async {
    return _get(
      '/customer/booking/specific-bookings',
      token: token,
      queryParams: {'status': status},
    );
  }

  /// GET /customer/booking/single-booking/:id - Get single booking details
  Future<ApiResult> getSingleBooking({
    required String token,
    required String bookingId,
  }) async {
    return _get(
      '/customer/booking/single-booking/$bookingId',
      token: token,
    );
  }

  /// PUT /customer/booking/cancel/:id - Cancel a booking
  Future<ApiResult> cancelBooking({
    required String token,
    required String bookingId,
  }) async {
    return _put(
      '/customer/booking/cancel/$bookingId',
      {},
      token: token,
    );
  }

  /// GET /customer/bookings - Get customer bookings (Legacy endpoint)
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
  // Customer Config & Version APIs
  // ============================================

  /// GET /customer/config-keys - Get configuration keys
  Future<ApiResult> getConfigKeys({
    required String token,
    required String adminId,
  }) async {
    return _get(
      '/customer/config-keys',
      token: token,
      queryParams: {'adminId': adminId},
    );
  }

  /// GET /customer/version/get - Get app version
  Future<ApiResult> getVersions({
    required String token,
    required String adminId,
  }) async {
    return _get(
      '/customer/version/get',
      token: token,
      queryParams: {'adminId': adminId},
    );
  }

  /// GET /customer/services - Get service types
  Future<ApiResult> getServices({
    required String token,
    required String adminId,
    String? customerId,
  }) async {
    final queryParams = {'adminId': adminId};
    if (customerId != null) queryParams['customerId'] = customerId;

    return _get(
      '/customer/services',
      token: token,
      queryParams: queryParams,
    );
  }

  /// GET /customer/vehicles-by-service - Get vehicles for a service
  Future<ApiResult> getVehiclesByService({
    required String token,
    required String adminId,
    required String serviceId,
  }) async {
    return _get(
      '/customer/vehicles-by-service',
      token: token,
      queryParams: {
        'adminId': adminId,
        'serviceId': serviceId,
      },
    );
  }

  /// GET /customer/offers/get - Get all offers
  Future<ApiResult> getAllOffers({
    required String token,
    required String adminId,
    required String customerId,
  }) async {
    return _get(
      '/customer/offers/get',
      token: token,
      queryParams: {
        'adminId': adminId,
        'customerId': customerId,
      },
    );
  }

  /// GET /customer/notifications/all - Get all notifications
  Future<ApiResult> getAllNotifications({
    required String token,
    required String adminId,
    required String customerId,
  }) async {
    return _get(
      '/customer/notifications/all',
      token: token,
      queryParams: {
        'adminId': adminId,
        'customerId': customerId,
      },
    );
  }

  /// DELETE /customer/notifications/delete - Delete notifications (Bulk)
  Future<ApiResult> deleteNotification({
    required String token,
    required String adminId,
    required String customerId,
    required List<String> notificationIds,
  }) async {
    return _delete(
      '/customer/notifications/delete',
      {
        'adminId': adminId,
        'customerId': customerId,
        'ids': notificationIds,
      },
      token: token,
    );
  }

  /// PUT /customer/notifications/read/:id - Mark single notification as read
  Future<ApiResult> markNotificationAsRead({
    required String token,
    required String adminId,
    required String customerId,
    required String notificationId,
  }) async {
    return _put(
      '/customer/notifications/read/$notificationId',
      {
        'adminId': adminId,
        'customerId': customerId,
      },
      token: token,
    );
  }

  /// PUT /customer/notifications/read-all - Mark all notifications as read
  Future<ApiResult> markAllNotificationsAsRead({
    required String token,
    required String adminId,
    required String customerId,
  }) async {
    return _put(
      '/customer/notifications/read-all',
      {
        'adminId': adminId,
        'customerId': customerId,
      },
      token: token,
    );
  }

  // ============================================
  // Promo Code APIs
  // ============================================

  /// GET /customer/promo-codes/get - Get all promo codes
  Future<ApiResult> getPromoCodes({
    required String token,
    required String adminId,
    required String customerId,
  }) async {
    return _get(
      '/customer/promo-codes/get',
      token: token,
      queryParams: {
        'adminId': adminId,
        'customerId': customerId,
      },
    );
  }

  /// POST /customer/promo-codes/validate - Validate/Apply promo code
  Future<ApiResult> validatePromoCode({
    required String token,
    required String adminId,
    required String customerId,
    required String promoCode,
    required String actionType, // "applyPromo" or "removePromo"
    required num estimatedAmount,
    required num taxAmount,
    required num driverBeta,
    required String serviceType,
    String? offerId,
  }) async {
    return _post(
      '/customer/promo-codes/validate',
      {
        'adminId': adminId,
        'customerId': customerId,
        'promoCode': promoCode,
        'actionType': actionType,
        'estimatedAmount': estimatedAmount,
        'taxAmount': taxAmount,
        'driverBeta': driverBeta,
        'serviceType': serviceType,
        if (offerId != null) 'offerId': offerId,
      },
      token: token,
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

      _log('[CustomerApiClient] GET $path');
      if (token != null) {
        _log('[CustomerApiClient] Token provided: ${token.substring(0, 20)}...');
      } else {
        _log('[CustomerApiClient] ⚠️ No token provided');
      }

      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final resp = await http.get(uri, headers: headers).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout: Server did not respond within 30 seconds');
        },
      );

      _log('[CustomerApiClient] Response status: ${resp.statusCode}');
      _log('[CustomerApiClient] Response body preview: ${_bodyPreview(resp.body)}');
      
      Map<String, dynamic> body;
      try {
        if (resp.body.isNotEmpty) {
          body = jsonDecode(resp.body) as Map<String, dynamic>;
        } else {
          body = {
            'success': resp.statusCode >= 200 && resp.statusCode < 300,
            'message': resp.statusCode >= 200 && resp.statusCode < 300 
                ? 'Request successful' 
                : 'Request failed',
          };
        }
      } catch (e) {
        // If response is not JSON (e.g., 404 HTML page), return error info
        _log('[CustomerApiClient] ⚠️ Failed to parse JSON response: $e');
        final errorPreview = resp.body.length > 200 
            ? resp.body.substring(0, 200) 
            : resp.body;
        body = {
          'success': false,
          'message': 'Server returned invalid response format',
          'error': 'Failed to parse JSON: ${e.toString()}',
          'rawBody': errorPreview,
        };
        _log('[CustomerApiClient] Response body: $errorPreview');
      }

      // Check for authentication errors
      if (resp.statusCode == 401) {
        final errorMsg = body['message']?.toString() ?? 
                        body['error']?.toString() ?? 
                        'Authentication required';
        _log('[CustomerApiClient] ❌ 401 Unauthorized: $errorMsg');
        if (token == null) {
          _log('[CustomerApiClient] ⚠️ No token was provided for this request');
        }
      }

      return ApiResult(
        statusCode: resp.statusCode,
        body: body,
        success: allowedStatus.contains(resp.statusCode) || 
                (resp.statusCode >= 200 && resp.statusCode < 300),
      );
    } on http.ClientException catch (e) {
      _log('[CustomerApiClient] ❌ Network error: $e');
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': 'Network error: Unable to connect to server. Please check your internet connection.',
          'error': e.toString(),
        },
        success: false,
      );
    } on Exception catch (e) {
      _log('[CustomerApiClient] ❌ Exception: $e');
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': e.toString(),
          'error': e.toString(),
        },
        success: false,
      );
    } catch (e) {
      _log('[CustomerApiClient] ❌ Unexpected error: $e');
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': 'Unexpected error occurred',
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
      
      _log('[CustomerApiClient] POST $path');
      if (token != null) {
        _log('[CustomerApiClient] Token provided: ${token.substring(0, 20)}...');
      } else {
        _log('[CustomerApiClient] ⚠️ No token provided');
      }
      
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
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout: Server did not respond within 30 seconds');
        },
      );

      _log('[CustomerApiClient] Response status: ${resp.statusCode}');
      _log('[CustomerApiClient] Response body preview: ${_bodyPreview(resp.body)}');

      Map<String, dynamic> body;
      try {
        if (resp.body.isNotEmpty) {
          body = jsonDecode(resp.body) as Map<String, dynamic>;
        } else {
          body = {
            'success': resp.statusCode >= 200 && resp.statusCode < 300,
            'message': resp.statusCode >= 200 && resp.statusCode < 300 
                ? 'Request successful' 
                : 'Request failed',
          };
        }
      } catch (e) {
        // If response is not JSON (e.g., 404 HTML page), return error info
        _log('[CustomerApiClient] ⚠️ Failed to parse JSON response: $e');
        final errorPreview = resp.body.length > 200 
            ? resp.body.substring(0, 200) 
            : resp.body;
        body = {
          'success': false,
          'message': 'Server returned invalid response format',
          'error': 'Failed to parse JSON: ${e.toString()}',
          'rawBody': errorPreview,
        };
        _log('[CustomerApiClient] Response body: $errorPreview');
      }

      // Check for authentication errors
      if (resp.statusCode == 401) {
        final errorMsg = body['message']?.toString() ?? 
                        body['error']?.toString() ?? 
                        'Authentication required';
        _log('[CustomerApiClient] ❌ 401 Unauthorized: $errorMsg');
        _log('[CustomerApiClient] Full response: $body');
        if (token == null) {
          _log('[CustomerApiClient] ⚠️ No token was provided for this request');
        } else {
          _log('[CustomerApiClient] ⚠️ Token was provided but authentication failed');
          _log('[CustomerApiClient] Possible causes:');
          _log('[CustomerApiClient]   1. Token expired');
          _log('[CustomerApiClient]   2. Invalid token format');
          _log('[CustomerApiClient]   3. Token not authorized for this endpoint');
        }
      }

      return ApiResult(
        statusCode: resp.statusCode,
        body: body,
        success: allowedStatus.contains(resp.statusCode) || 
                (resp.statusCode >= 200 && resp.statusCode < 300),
      );
    } on http.ClientException catch (e) {
      _log('[CustomerApiClient] ❌ Network error: $e');
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': 'Network error: Unable to connect to server. Please check your internet connection.',
          'error': e.toString(),
        },
        success: false,
      );
    } on Exception catch (e) {
      _log('[CustomerApiClient] ❌ Exception: $e');
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': e.toString(),
          'error': e.toString(),
        },
        success: false,
      );
    } catch (e) {
      _log('[CustomerApiClient] ❌ Unexpected error: $e');
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': 'Unexpected error occurred',
          'error': e.toString(),
        },
        success: false,
      );
    }
  }

  Future<ApiResult> _delete(
    String path,
    Map<String, dynamic> data, {
    String? token,
    Set<int> allowedStatus = const {200},
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$path');
      
      _log('[CustomerApiClient] DELETE $path');
      if (token != null) {
        _log('[CustomerApiClient] Token provided: ${token.substring(0, 20)}...');
      } else {
        _log('[CustomerApiClient] ⚠️ No token provided');
      }
      
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final resp = await http.delete(
        uri,
        headers: headers,
        body: jsonEncode(data),
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout: Server did not respond within 30 seconds');
        },
      );

      _log('[CustomerApiClient] Response status: ${resp.statusCode}');
      _log('[CustomerApiClient] Response body preview: ${_bodyPreview(resp.body)}');

      Map<String, dynamic> body;
      try {
        if (resp.body.isNotEmpty) {
          body = jsonDecode(resp.body) as Map<String, dynamic>;
        } else {
          body = {
            'success': resp.statusCode >= 200 && resp.statusCode < 300,
            'message': resp.statusCode >= 200 && resp.statusCode < 300 
                ? 'Request successful' 
                : 'Request failed',
          };
        }
      } catch (e) {
        _log('[CustomerApiClient] ⚠️ Failed to parse JSON response: $e');
        final errorPreview = resp.body.length > 200 
            ? resp.body.substring(0, 200) 
            : resp.body;
        body = {
          'success': false,
          'message': 'Server returned invalid response format',
          'error': 'Failed to parse JSON: ${e.toString()}',
          'rawBody': errorPreview,
        };
        _log('[CustomerApiClient] Response body: $errorPreview');
      }

      if (resp.statusCode == 401) {
        final errorMsg = body['message']?.toString() ?? 
                        body['error']?.toString() ?? 
                        'Authentication required';
        _log('[CustomerApiClient] ❌ 401 Unauthorized: $errorMsg');
      }

      return ApiResult(
        statusCode: resp.statusCode,
        body: body,
        success: allowedStatus.contains(resp.statusCode) || 
                (resp.statusCode >= 200 && resp.statusCode < 300),
      );
    } on http.ClientException catch (e) {
      _log('[CustomerApiClient] ❌ Network error: $e');
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': 'Network error: Unable to connect to server.',
          'error': e.toString(),
        },
        success: false,
      );
    } catch (e) {
      _log('[CustomerApiClient] ❌ Unexpected error: $e');
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': 'Unexpected error occurred',
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
      
      _log('[CustomerApiClient] PUT $path');
      if (token != null) {
        _log('[CustomerApiClient] Token provided: ${token.substring(0, 20)}...');
      } else {
        _log('[CustomerApiClient] ⚠️ No token provided');
      }
      
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
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout: Server did not respond within 30 seconds');
        },
      );

      _log('[CustomerApiClient] Response status: ${resp.statusCode}');
      _log('[CustomerApiClient] Response body preview: ${_bodyPreview(resp.body)}');

      Map<String, dynamic> body;
      try {
        if (resp.body.isNotEmpty) {
          body = jsonDecode(resp.body) as Map<String, dynamic>;
        } else {
          body = {
            'success': resp.statusCode >= 200 && resp.statusCode < 300,
            'message': resp.statusCode >= 200 && resp.statusCode < 300 
                ? 'Request successful' 
                : 'Request failed',
          };
        }
      } catch (e) {
        _log('[CustomerApiClient] ⚠️ Failed to parse JSON response: $e');
        final errorPreview = resp.body.length > 200 
            ? resp.body.substring(0, 200) 
            : resp.body;
        body = {
          'success': false,
          'message': 'Server returned invalid response format',
          'error': 'Failed to parse JSON: ${e.toString()}',
          'rawBody': errorPreview,
        };
        _log('[CustomerApiClient] Response body: $errorPreview');
      }

      // Check for authentication errors
      if (resp.statusCode == 401) {
        final errorMsg = body['message']?.toString() ?? 
                        body['error']?.toString() ?? 
                        'Authentication required';
        _log('[CustomerApiClient] ❌ 401 Unauthorized: $errorMsg');
        if (token == null) {
          _log('[CustomerApiClient] ⚠️ No token was provided for this request');
        }
      }

      return ApiResult(
        statusCode: resp.statusCode,
        body: body,
        success: allowedStatus.contains(resp.statusCode) || 
                (resp.statusCode >= 200 && resp.statusCode < 300),
      );
    } on http.ClientException catch (e) {
      _log('[CustomerApiClient] ❌ Network error: $e');
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': 'Network error: Unable to connect to server. Please check your internet connection.',
          'error': e.toString(),
        },
        success: false,
      );
    } on Exception catch (e) {
      _log('[CustomerApiClient] ❌ Exception: $e');
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': e.toString(),
          'error': e.toString(),
        },
        success: false,
      );
    } catch (e) {
      _log('[CustomerApiClient] ❌ Unexpected error: $e');
      return ApiResult(
        statusCode: 0,
        body: {
          'success': false,
          'message': 'Unexpected error occurred',
          'error': e.toString(),
        },
        success: false,
      );
    }
  }

  String _bodyPreview(String body) {
    if (body.length <= 200) return body;
    return '${body.substring(0, 200)}...';
  }

  void _log(String message) {
    debugPrint(message);
  }
}

