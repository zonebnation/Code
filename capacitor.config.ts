import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.codecanvas.app',
  appName: 'Code Canvas',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#1E1E1E",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "large",
      spinnerColor: "#3794FF",
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#1E1E1E"
    }
  },
  android: {
    buildOptions: {
      keystorePath: "my-release-key.keystore",
      keystoreAlias: "my-key-alias"
    }
  }
};

export default config;