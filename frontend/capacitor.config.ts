import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.kabutar.app',
  appName: 'Kabutar',
  webDir: 'dist',
  server: {
    // Remove this block when building for production APK
    // Uncomment ONLY for live-reload during development:
    // url: 'http://192.168.X.X:5173',
    // cleartext: true,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // set true only when debugging
    backgroundColor: '#f97316',          // orange — matches splash screen
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
  },
};

export default config;
