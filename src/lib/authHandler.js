import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth";
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
    // Use signInWithRedirect - this will redirect within the webview to Firebase
    await signInWithRedirect(auth, provider);
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


