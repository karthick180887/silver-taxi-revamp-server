import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http/http.dart';
import 'api_config.dart';
import 'api_result.dart';

class BaseApiClient {
  final String baseUrl;

  BaseApiClient({String? baseUrl}) : baseUrl = baseUrl ?? ApiConfig.baseUrl;

  Map<String, String> _headers({String? token}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<ApiResult> get(
    String path, {
    String? token,
    Map<String, String>? queryParams,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$path').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: _headers(token: token));
      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  Future<ApiResult> post(
    String path,
    dynamic body, {
    String? token,
    Set<int>? allowedStatus,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl$path'),
        headers: _headers(token: token),
        body: jsonEncode(body),
      );
      return _handleResponse(response, allowedStatus: allowedStatus);
    } catch (e) {
      return _handleError(e);
    }
  }

  Future<ApiResult> put(
    String path,
    dynamic body, {
    String? token,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl$path'),
        headers: _headers(token: token),
        body: jsonEncode(body),
      );
      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  Future<ApiResult> patch(
    String path,
    dynamic body, {
    String? token,
  }) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl$path'),
        headers: _headers(token: token),
        body: jsonEncode(body),
      );
      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  Future<ApiResult> delete(
    String path,
    dynamic body, {
    String? token,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl$path'),
        headers: _headers(token: token),
        body: jsonEncode(body),
      );
      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  Future<ApiResult> uploadFile({
    required String path,
    required String token,
    required String filePath,
    required String fileFieldName,
    required Map<String, String> fields,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$path');
      final request = http.MultipartRequest('POST', uri);
      
      request.headers.addAll(_headers(token: token));
      request.fields.addAll(fields);
      
      final file = await http.MultipartFile.fromPath(fileFieldName, filePath);
      request.files.add(file);

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  ApiResult _handleResponse(http.Response response, {Set<int>? allowedStatus}) {
    final isSuccess = (response.statusCode >= 200 && response.statusCode < 300) ||
        (allowedStatus != null && allowedStatus.contains(response.statusCode));
        
    dynamic data;
    try {
      if (response.body.isNotEmpty) {
        data = jsonDecode(response.body);
      }
    } catch (_) {
      data = response.body;
    }

    String message = '';
    if (data is Map && data.containsKey('message')) {
      final messageValue = data['message'];
      // Handle array messages (validation errors)
      if (messageValue is List) {
        final errorMessages = <String>[];
        for (var item in messageValue) {
          if (item is Map && item.containsKey('message')) {
            errorMessages.add(item['message'].toString());
          } else {
            errorMessages.add(item.toString());
          }
        }
        message = errorMessages.join('. ');
      } else {
        message = messageValue.toString();
      }
    } else if (!isSuccess) {
      message = 'Request failed with status: ${response.statusCode}';
    }

    return ApiResult(
      success: isSuccess,
      message: message,
      data: data,
      statusCode: response.statusCode,
    );
  }

  ApiResult _handleError(dynamic error) {
    return ApiResult(
      success: false,
      message: error.toString(),
      data: null,
      statusCode: 500,
    );
  }
}
