class ApiConfig {
  // API base URL - update this to match your server IP
  // For physical device: use your machine's local IP (e.g., 192.168.0.102)
  // For Android Emulator: use 10.0.2.2 to access host machine
  // For iOS Simulator: use localhost or 127.0.0.1
  static const String baseUrl = "http://192.168.1.107:30060"; 
  
  static String transformImageUrl(String? url) {
    if (url == null || url.isEmpty) return "";
    if (url.startsWith("http")) return url;
    return "$baseUrl$url";
  }
}
