/// <reference types="@capacitor-firebase/authentication" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bhoomitayi.app',
  appName: 'BhoomiTayi',
  webDir: 'www',
  server: {
    url: 'https://bhoomitayiversion2.vercel.app',
    cleartext: true,
    allowNavigation: [
      'bhoomitayiversion2.vercel.app',
      '*.bhoomitayiversion2.vercel.app',
      'real-estate-4a9f1.firebaseapp.com',
      '*.firebaseapp.com',
      'accounts.google.com',
      '*.google.com',
    ]
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    FirebaseAuthentication: {
      authDomain: 'real-estate-4a9f1.firebaseapp.com',
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;
