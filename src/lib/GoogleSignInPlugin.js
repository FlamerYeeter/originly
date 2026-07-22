import { registerPlugin } from '@capacitor/core';

export const GoogleSignIn = registerPlugin('GoogleSignIn', {
  web: () => ({
    initialize: async () => {
      throw new Error('Native GoogleSignIn is not available on web.');
    },
    signIn: async () => {
      throw new Error('Native GoogleSignIn is not available on web.');
    },
  }),
});
