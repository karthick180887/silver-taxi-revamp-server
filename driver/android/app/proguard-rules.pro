# Socket.IO and Engine.IO
-keep class io.socket.** { *; }
-keepnames class io.socket.** { *; }
-keep interface io.socket.** { *; }
-dontwarn io.socket.**

# OkHttp and Okio
-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Gson
-keep class com.google.gson.** { *; }
-keep class sun.misc.Unsafe { *; }
-keep class org.json.** { *; }

# Retain generic type information for Gson
-keepattributes Signature
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# App specific classes
-keep class cabigo.driver.** { *; }

# Flutter typically handles its own ProGuard rules, but specific native deps need help

# Google ML Kit Text Recognition (Optional dependencies)
-dontwarn com.google.mlkit.vision.text.chinese.**
-dontwarn com.google.mlkit.vision.text.devanagari.**
-dontwarn com.google.mlkit.vision.text.japanese.**
-dontwarn com.google.mlkit.vision.text.korean.**
-dontwarn com.google.mlkit.vision.text.latin.**
-dontwarn com.google.mlkit.vision.text.**

