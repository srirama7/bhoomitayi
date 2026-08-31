/// <reference types="@capacitor-firebase/authentication" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bhoomitayi.app',
  appName: 'BhoomiTayi',
  webDir: 'out',
  android: {
    allowMixedContent: true,
  },
  plugins: {
    FirebaseAuthentication: {
      authDomain: 'real-estate-4a9f1.firebaseapp.com',
      skipNativeAuth: false,
      providers: ['google.com'],
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: false,
      splashImmersive: false,
      layoutName: "launch_screen",
      useDialog: true,
    },
  },
};

export default config;
