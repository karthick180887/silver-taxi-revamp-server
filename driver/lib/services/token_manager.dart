import 'dart:async';
import 'package:flutter/foundation.dart';
import 'storage_service.dart';
import '../api_client.dart';

/// Service to manage authentication tokens with automatic refresh capability
class TokenManager {
  static TokenManager? _instance;
  static TokenManager get instance => _instance ??= TokenManager._();
  
  TokenManager._();
  
  final _api = DriverApiClient(baseUrl: kApiBaseUrl);
  bool _isRefreshing = false;
  Completer<String?>? _refreshCompleter;
  
  /// Callback to notify when token is refreshed (so MainScreen can update its token)
  void Function(String newToken)? onTokenRefreshed;
  
  /// Callback to notify when refresh fails and user needs to re-login
  void Function()? onSessionExpired;
  
  /// Get a valid token - refreshes if the current token is expired
  /// Returns the current token or a refreshed token
  Future<String?> getValidToken() async {
    final token = await StorageService.getToken();
    if (token == null || token.isEmpty) {
      return null;
    }
    return token;
  }
  
  /// Attempt to refresh the access token using the refresh token
  /// Returns the new access token if successful, null otherwise
  Future<String?> refreshToken() async {
    // Prevent multiple simultaneous refresh attempts
    if (_isRefreshing) {
      debugPrint('[TokenManager] Already refreshing, waiting for result...');
      return _refreshCompleter?.future;
    }
    
    _isRefreshing = true;
    _refreshCompleter = Completer<String?>();
    
    try {
      final refreshToken = await StorageService.getRefreshToken();
      
      if (refreshToken == null || refreshToken.isEmpty) {
        debugPrint('[TokenManager] No refresh token available');
        _completeRefresh(null);
        onSessionExpired?.call();
        return null;
      }
      
      debugPrint('[TokenManager] Attempting token refresh...');
      
      // Call the backend refresh endpoint
      final result = await _api.post('/app/auth/access-token', {
        'refreshToken': refreshToken,
      });
      
      if (result.success && result.body['data']?['token'] != null) {
        final newToken = result.body['data']['token'] as String;
        debugPrint('[TokenManager] Token refreshed successfully');
        
        // Save the new token
        await StorageService.saveToken(newToken);
        
        // Notify listeners
        onTokenRefreshed?.call(newToken);
        
        _completeRefresh(newToken);
        return newToken;
      } else {
        debugPrint('[TokenManager] Token refresh failed: ${result.message}');
        _completeRefresh(null);
        
        // If refresh token is also expired, session is expired
        if (result.statusCode == 401) {
          onSessionExpired?.call();
        }
        return null;
      }
    } catch (e) {
      debugPrint('[TokenManager] Token refresh error: $e');
      _completeRefresh(null);
      return null;
    }
  }
  
  void _completeRefresh(String? result) {
    _isRefreshing = false;
    _refreshCompleter?.complete(result);
    _refreshCompleter = null;
  }
  
  /// Clear all tokens (for logout)
  Future<void> clearTokens() async {
    await StorageService.clearAll();
  }
}

/// Extension on DriverApiClient to add automatic token refresh
extension TokenRefreshExtension on DriverApiClient {
  /// Makes an API call with automatic token refresh on 401
  Future<ApiResult> callWithRefresh({
    required String token,
    required Future<ApiResult> Function(String token) apiCall,
  }) async {
    var result = await apiCall(token);
    
    // If we get a 401 with "Token expired" message, try to refresh
    if (result.statusCode == 401) {
      final errorMessage = (result.body['message'] ?? result.message).toString().toLowerCase();
      
      if (errorMessage.contains('expired') || errorMessage.contains('token')) {
        debugPrint('[TokenRefresh] Got 401, attempting token refresh...');
        
        // Try to refresh the token
        final newToken = await TokenManager.instance.refreshToken();
        
        if (newToken != null) {
          // Retry the original call with the new token
          debugPrint('[TokenRefresh] Retrying with new token...');
          result = await apiCall(newToken);
        }
      }
    }
    
    return result;
  }
}
