# ── Kabutar ProGuard / R8 Rules ──────────────────────────────────────────────

# Preserve line numbers in crash reports (Crashlytics / Play Console)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Capacitor / Cordova ───────────────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-dontwarn com.getcapacitor.**

# ── Firebase ──────────────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-keep class com.google.firebase.auth.FirebaseAuth { *; }
-keep class com.google.firebase.auth.FirebaseAuthSettings { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ── Gson / JSON (used by Capacitor plugins internally) ────────────────────────
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# ── OkHttp ────────────────────────────────────────────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# ── WebView JS bridge ─────────────────────────────────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── App classes ───────────────────────────────────────────────────────────────
-keep class in.kabutar.app.** { *; }
