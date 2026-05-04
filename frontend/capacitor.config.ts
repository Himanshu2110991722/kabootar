import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.kabutar.app',
  appName: 'Kabutar',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#f97316',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#f97316',
      androidSplashResourceName: 'splash',
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
