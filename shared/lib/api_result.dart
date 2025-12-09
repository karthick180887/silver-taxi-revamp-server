class ApiResult {
  final bool success;
  final String message;
  final dynamic data;
  final int statusCode;

  ApiResult({
    required this.success,
    required this.message,
    this.data,
    required this.statusCode,
  });

  // Getter for backward compatibility with existing code expecting 'body'
  Map<String, dynamic> get body {
    if (data is Map<String, dynamic>) {
      return data as Map<String, dynamic>;
    }
    return {'data': data};
  }
}
