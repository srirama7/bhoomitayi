import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bhoomitayi.app',
  appName: 'BhoomiTayi',
  webDir: 'www',
  server: {
    url: 'https://propnest.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
