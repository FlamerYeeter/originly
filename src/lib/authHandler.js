import { Capacitor } from "@capacitor/core";
import { signInWithPopup, signInWithCredential, GoogleAuthProvider, getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

const vercelUrl = "https://originly-two.vercel.app";

/**
 * Initiates OAuth flow by redirecting within the webview context.
 * This uses Firebase's built-in redirect flow which works better for native apps.
 */
export async function initiateOAuthFlow() {
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");

  try {
    // Try our custom native GoogleSignIn Capacitor plugin (registered in Android MainActivity)
    if (typeof window !== "undefined" && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleSignIn) {
      try {
        const GoogleSignIn = window.Capacitor.Plugins.GoogleSignIn;
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_SERVER_CLIENT_ID || null;
        if (clientId && typeof GoogleSignIn.initialize === 'function') {
          await GoogleSignIn.initialize({ clientId });
        }
        const result = await GoogleSignIn.signIn();
        const idToken = result?.idToken || result?.authentication?.idToken;
        const accessToken = result?.accessToken || result?.authentication?.accessToken;
        if (idToken || accessToken) {
          const credential = GoogleAuthProvider.credential(idToken ?? null, accessToken ?? null);
          await signInWithCredential(auth, credential);
          return;
        }
      } catch (nativeErr) {
        console.warn('Native GoogleSignIn plugin failed:', nativeErr);
      }
    }
    // Try the Codetrix Capacitor Google Auth plugin first (dynamic import so the code still runs on web)
    if (typeof window !== "undefined") {
      try {
        const mod = await import('@codetrix-studio/capacitor-google-auth');
        const GoogleAuth = mod.GoogleAuth ?? mod.default;
        if (GoogleAuth && typeof GoogleAuth.signIn === 'function') {
          const result = await GoogleAuth.signIn();
          const idToken = result?.authentication?.idToken;
          const accessToken = result?.authentication?.accessToken;
          if (idToken || accessToken) {
            const credential = GoogleAuthProvider.credential(idToken ?? null, accessToken ?? null);
            await signInWithCredential(auth, credential);
            return;
          }
        }
      } catch (pluginErr) {
        console.warn('GoogleAuth plugin not available or failed, falling back to web popup', pluginErr);
      }
    }

    // Web fallback: open Firebase web popup
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("OAuth flow error:", error);
    throw error;
  }
}

/**
 * Handles redirect result after auth completes.
 */
export async function handleAuthRedirectResult(onSuccess, onError) {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      onSuccess(result.user);
    }
  } catch (error) {
    console.error("Auth redirect result error:", error);
    onError(error);
  }
}

/**
 * Sets up a listener for auth state changes.
 */
export function setupAuthStateListener(onAuthStateChange) {
  return auth.onAuthStateChanged((user) => {
    onAuthStateChange(user);
  });
}


