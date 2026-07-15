import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'originly',
  webDir: 'out',
  server: {
    url: 'https://originly-two.vercel.app',
    cleartext: false,
  },
};

export default config;
