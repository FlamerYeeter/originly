"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { initiateOAuthFlow } from "@/lib/authHandler";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
      setSigningIn(false);
      return;
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setStatusMessage("Starting Google sign-in...");
    setErrorMessage("");

    try {
      await initiateOAuthFlow();
    } catch (error) {
      console.error("Sign in error:", error);
      setSigningIn(false);
      setStatusMessage("");
      setErrorMessage(
        error?.message || "Unable to sign in. Please try again or check your app configuration."
      );
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
          disabled={signingIn}
          className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {signingIn ? "Signing in..." : "Sign in with Google"}
        </button>

        {statusMessage ? (
          <p className="mt-4 text-sm text-blue-600">{statusMessage}</p>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 text-sm text-red-600 whitespace-pre-line">{errorMessage}</p>
        ) : null}
      </div>
    </div>
  );
}