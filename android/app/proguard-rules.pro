# Add project specific ProGuard rules here.

# ── Preserve line numbers for stack traces ──────────────────────────
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Capacitor / WebView JS bridge ───────────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**

# ── Firebase ─────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# ── Facebook SDK stubs (referenced by capacitor-firebase-authentication)
# The plugin optionally supports Facebook login; we don't use it,
# so just suppress the missing-class errors so R8 doesn't abort.
-dontwarn com.facebook.**
-keep class com.facebook.** { *; }

# ── Capacitor Firebase Authentication plugin ─────────────────────────
-keep class io.capawesome.capacitorjs.plugins.firebase.** { *; }
-dontwarn io.capawesome.capacitorjs.plugins.firebase.**

# ── Capacitor Splash Screen ──────────────────────────────────────────
-keep class com.capacitorjs.plugins.splashscreen.** { *; }
-dontwarn com.capacitorjs.plugins.splashscreen.**

# ── Kotlin / Coroutines ──────────────────────────────────────────────
-keep class kotlin.** { *; }
-dontwarn kotlin.**
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# ── General Android / Androidx ───────────────────────────────────────
-dontwarn androidx.**
-keep class androidx.** { *; }

