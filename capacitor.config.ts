import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'originly',
  webDir: 'out',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // Replace with your Web/Server client ID from Google Cloud console
      serverClientId: process.env.NEXT_PUBLIC_GOOGLE_SERVER_CLIENT_ID || 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      forceCodeForRefreshToken: false,
    },
  },
};

export default config;
