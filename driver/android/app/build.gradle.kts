plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services") // Firebase Google Services plugin
}

// Properties loading removed for debugging

android {
    namespace = "com.cabigo.driver"
    compileSdk = 36
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        isCoreLibraryDesugaringEnabled = true
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.cabigo.driver"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = 34
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            storeFile = file("upload-keystore.jks")
            storePassword = "android"
            keyAlias = "upload"
            keyPassword = "android"
        }
    }

    buildTypes {
        release {
            // Use the release signing config if available, otherwise debug (handled above)
            // Note: The 'create("release")' above actually ADDS it to signingConfigs.
            // We need to reference it here.
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    // Core library desugaring for flutter_local_notifications
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
    
    // CardView for overlay UI
    implementation("androidx.cardview:cardview:1.0.0")
    
    // Firebase Messaging for native FCM service (background notifications)
    implementation("com.google.firebase:firebase-messaging-ktx")

    // Socket.IO for native background service
    implementation("io.socket:socket.io-client:2.1.0")
    
    // Kotlin Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    
    // Lifecycle Service
    implementation("androidx.lifecycle:lifecycle-service:2.6.2")
    
    // Gson for JSON parsing in native services
    implementation("com.google.code.gson:gson:2.10.1")
}
