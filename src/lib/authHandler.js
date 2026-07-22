import { Capacitor } from "@capacitor/core";
import { signInWithPopup, signInWithCredential, GoogleAuthProvider, getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { GoogleSignIn } from "@/lib/GoogleSignInPlugin";

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
  const isNativePlatform = platform === "android" || platform === "ios";
  const capacitorObject = typeof window !== "undefined" ? window.Capacitor : undefined;
  const isPluginAvailable = typeof Capacitor.isPluginAvailable === "function" ? Capacitor.isPluginAvailable("GoogleSignIn") : false;
  const nativeGoogleSignIn = GoogleSignIn;

  console.debug("[authHandler] platform:", platform);
  console.debug("[authHandler] isNativePlatform:", isNativePlatform);
  console.debug("[authHandler] Capacitor object:", capacitorObject);
  console.debug("[authHandler] Capacitor.Plugins keys:", capacitorObject?.Plugins ? Object.keys(capacitorObject.Plugins) : undefined);
  console.debug("[authHandler] Capacitor.getPlugin available:", typeof Capacitor.getPlugin === "function");
  console.debug("[authHandler] Capacitor.isPluginAvailable available:", typeof Capacitor.isPluginAvailable === "function");
  console.debug("[authHandler] isPluginAvailable('GoogleSignIn'):", isPluginAvailable);
  console.debug("[authHandler] imported GoogleSignIn wrapper:", GoogleSignIn);
  console.debug("[authHandler] nativeGoogleSignIn (resolved):", nativeGoogleSignIn);

  if (!isNativePlatform || !isPluginAvailable || !nativeGoogleSignIn) {
    console.warn("Native GoogleSignIn plugin unavailable, falling back to web auth.", {
      platform,
      isNativePlatform,
      isPluginAvailable,
      nativeGoogleSignIn: Boolean(nativeGoogleSignIn),
    });
    try {
      await signInWithPopup(auth, provider);
      return;
    } catch (webErr) {
      console.error("Firebase web popup sign-in failed:", webErr);
      throw webErr;
    }
  }

  try {
    const defaultClientId = "771263408031-hh0m0b1c31df7nqlk619c4pmipui0s13.apps.googleusercontent.com";
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_SERVER_CLIENT_ID || defaultClientId;
    if (!clientId) {
      throw new Error("NEXT_PUBLIC_GOOGLE_SERVER_CLIENT_ID is required for native GoogleSignIn.");
    }
    if (typeof nativeGoogleSignIn.initialize === "function") {
      await nativeGoogleSignIn.initialize({ clientId });
    }

    const signInPromise = nativeGoogleSignIn.signIn();
    const result = await Promise.race([
      signInPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Native Google sign-in timed out. Please try again.")), 25000)
      ),
    ]);

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
    try {
      await signInWithPopup(auth, provider);
      return;
    } catch (webErr) {
      console.error("Fallback web popup sign-in failed:", webErr);
      throw nativeErr;
    }
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


