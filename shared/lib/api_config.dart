class ApiConfig {
  // Use 10.0.2.2 for Android Emulator to access host machine
  // Use localhost for iOS Simulator or Desktop
  static const String baseUrl = "http://10.0.2.2:30060"; 
  
  static String transformImageUrl(String? url) {
    if (url == null || url.isEmpty) return "";
    if (url.startsWith("http")) return url;
    return "$baseUrl$url";
  }
}
