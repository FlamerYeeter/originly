import { Capacitor } from "@capacitor/core";
import { signInWithPopup, signInWithCredential, GoogleAuthProvider, getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Initiates OAuth flow.
 * Tries the custom native GoogleSignIn Capacitor plugin first.
 * Only uses the Firebase web popup fallback on web.
 */
export async function initiateOAuthFlow() {
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");

  const platform = typeof Capacitor.getPlatform === "function" ? Capacitor.getPlatform() : "web";
  const hasNativePlugin = typeof window !== "undefined" &&
    (window.Capacitor?.Plugins?.GoogleSignIn || window.Capacitor?.GoogleSignIn);

  if (platform !== "web" && !hasNativePlugin) {
    throw new Error("Native GoogleSignIn plugin not found on device. Please ensure the custom Capacitor plugin is registered in MainActivity.");
  }

  if (hasNativePlugin) {
    const nativeGoogleSignIn = window.Capacitor?.Plugins?.GoogleSignIn || window.Capacitor?.GoogleSignIn;
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_SERVER_CLIENT_ID || null;
      if (!clientId) {
        throw new Error("NEXT_PUBLIC_GOOGLE_SERVER_CLIENT_ID is required for native GoogleSignIn.");
      }
      if (typeof nativeGoogleSignIn.initialize === "function") {
        await nativeGoogleSignIn.initialize({ clientId });
      }

      const result = await nativeGoogleSignIn.signIn();
      const idToken = result?.idToken ?? result?.authentication?.idToken;
      const accessToken = result?.accessToken ?? result?.authentication?.accessToken;

      if (!idToken && !accessToken) {
        throw new Error("Native GoogleSignIn returned no idToken or accessToken.");
      }

      const credential = GoogleAuthProvider.credential(idToken ?? null, accessToken ?? null);
      await signInWithCredential(auth, credential);
      return;
    } catch (nativeErr) {
      console.error("Native GoogleSignIn failed:", nativeErr);
      throw nativeErr;
    }
  }

  if (platform === "web") {
    try {
      await signInWithPopup(auth, provider);
      return;
    } catch (webErr) {
      console.error("Firebase web popup sign-in failed:", webErr);
      throw webErr;
    }
  }

  throw new Error("Unable to sign in: no fallback available on native platform.");
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


