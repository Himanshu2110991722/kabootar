import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.kabutar.app',
  appName: 'Kabutar',
  webDir: 'dist',
  // Android WebView serves assets under https://kabutar.in so Firebase OTP
  // and Google sign-in work. Ensure kabutar.in is listed in:
  // Firebase Console → Authentication → Settings → Authorized domains.
  server: {
    hostname: 'kabutar.in',
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#f97316',
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['phone', 'google.com'],
    },
    SplashScreen: {
      launchShowDuration: 0,     // hide native splash instantly — React handles the full animation
      launchAutoHide: true,
      backgroundColor: '#f97316',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#f97316',
    },
    // Native Google Sign-In — replaces signInWithPopup which breaks in Android WebView
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // Web client ID (type 3) from google-services.json
      serverClientId: '705500228139-epbriuarbpoqhpgb3051efn4kgevidvt.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
