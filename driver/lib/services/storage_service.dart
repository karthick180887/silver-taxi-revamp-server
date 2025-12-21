import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const String _keyToken = 'driver_token';
  static const String _keyRefreshToken = 'driver_refresh_token';
  static const String _keyDriverId = 'driver_id';
  static const String _keyDriverData = 'driver_data';
  static const String _keyPhone = 'driver_phone';

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyToken, token);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyToken);
  }

  static Future<void> saveRefreshToken(String refreshToken) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyRefreshToken, refreshToken);
  }

  static Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyRefreshToken);
  }

  static Future<void> saveDriverId(String driverId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyDriverId, driverId);
  }

  static Future<String?> getDriverId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyDriverId);
  }

  static Future<void> saveDriverData(Map<String, dynamic> driverData) async {
    final prefs = await SharedPreferences.getInstance();
    // Convert Map to JSON string
    final driverJson = driverData.toString(); // Simple approach, or use jsonEncode if needed
    await prefs.setString(_keyDriverData, driverJson);
  }

  static Future<Map<String, dynamic>?> getDriverData() async {
    final prefs = await SharedPreferences.getInstance();
    final driverJson = prefs.getString(_keyDriverData);
    if (driverJson == null) return null;
    // Parse JSON string back to Map
    // For now, return empty map - you might want to use jsonDecode if storing as JSON
    return {};
  }

  static Future<void> savePhone(String phone) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyPhone, phone);
  }

  static Future<String?> getPhone() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyPhone);
  }

  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyToken);
    await prefs.remove(_keyRefreshToken);
    await prefs.remove(_keyDriverId);
    await prefs.remove(_keyDriverData);
    await prefs.remove(_keyPhone);
  }

  static Future<void> clear() => clearAll();

  static Future<bool> hasToken() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
}

