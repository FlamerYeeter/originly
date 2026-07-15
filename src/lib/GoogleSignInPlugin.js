import { Capacitor, registerPlugin } from '@capacitor/core';

const native = {
  initialize: async (options) => {
    const cap = Capacitor;
    if (typeof cap.nativePromise !== 'function') {
      throw new Error('Capacitor native bridge is not available.');
    }
    return await cap.nativePromise('GoogleSignIn', 'initialize', options);
  },
  signIn: async () => {
    const cap = Capacitor;
    if (typeof cap.nativePromise !== 'function') {
      throw new Error('Capacitor native bridge is not available.');
    }
    return await cap.nativePromise('GoogleSignIn', 'signIn', {});
  },
};

export const GoogleSignIn = registerPlugin('GoogleSignIn', {
  android: native,
  ios: native,
  web: () => ({
    initialize: async () => {
      throw new Error('Native GoogleSignIn is not available on web.');
    },
    signIn: async () => {
      throw new Error('Native GoogleSignIn is not available on web.');
    },
  }),
});
