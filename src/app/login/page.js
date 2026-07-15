"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Capacitor } from "@capacitor/core";
import {
  initiateOAuthFlow,
  setupAuthStateListener,
} from "@/lib/authHandler";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
      setSigningIn(false);
      return;
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      if (Capacitor.isNativePlatform()) {
        // On native, use Firebase redirect which works within the webview
        await initiateOAuthFlow();
      } else {
        // On web, use popup
        const provider = new GoogleAuthProvider();
        provider.addScope("profile");
        provider.addScope("email");
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setSigningIn(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Originly</h1>
        <p className="text-gray-600 mb-8">
          Capture your ideas. Prove they are yours.
        </p>
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}