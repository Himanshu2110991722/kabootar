import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.kabutar.app',
  appName: 'Kabutar',
  webDir: 'dist',
  // Make the Android WebView serve assets under https://app.kabutar.in.
  // Firebase's reCAPTCHA (used by JS SDK phone auth) requires a trusted, authorized
  // domain — localhost scores poorly and SMS is blocked for real numbers.
  // app.kabutar.in is already in Firebase Console authorized domains.
  server: {
    hostname: 'app.kabutar.in',
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
