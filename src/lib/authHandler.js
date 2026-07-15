import { Capacitor } from "@capacitor/core";
import { signInWithPopup, signInWithCredential, GoogleAuthProvider, getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Initiates OAuth flow.
 * Tries the custom native GoogleSignIn Capacitor plugin first and falls back to Firebase web popup.
 */
export async function initiateOAuthFlow() {
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");

  const nativeGoogleSignIn = typeof window !== "undefined"
    ? Capacitor?.Plugins?.GoogleSignIn || window?.Capacitor?.Plugins?.GoogleSignIn
    : null;

  if (nativeGoogleSignIn) {
    try {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_SERVER_CLIENT_ID || null;
      if (clientId && typeof nativeGoogleSignIn.initialize === "function") {
        await nativeGoogleSignIn.initialize({ clientId });
      }

      const result = await nativeGoogleSignIn.signIn();
      const idToken = result?.idToken ?? result?.authentication?.idToken;
      const accessToken = result?.accessToken ?? result?.authentication?.accessToken;

      if (idToken || accessToken) {
        const credential = GoogleAuthProvider.credential(idToken ?? null, accessToken ?? null);
        await signInWithCredential(auth, credential);
        return;
      }

      console.warn("Native GoogleSignIn returned no tokens; falling back to web popup.");
    } catch (nativeErr) {
      console.warn("Native GoogleSignIn plugin failed; falling back to web popup:", nativeErr);
    }
  } else {
    console.info("Native GoogleSignIn plugin unavailable; using web popup fallback.");
  }

  try {
    await signInWithPopup(auth, provider);
  } catch (webErr) {
    console.error("Firebase web popup sign-in failed:", webErr);
    throw webErr;
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


