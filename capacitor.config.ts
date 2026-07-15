import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'originly',
  webDir: 'out',
  plugins: {
    GoogleAuth: {
      serverClientId: '771263408031-hh0m0b1c31df7nqlk619c4pmipui0s13.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      forceCodeForRefreshToken: false,
    },
  },
};

export default config;
