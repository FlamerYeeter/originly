"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { initiateOAuthFlow } from "@/lib/authHandler";
import PiLoginButton from "@/components/PiLoginButton";

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

  const handlePiSuccess = (result) => {
    console.log("Pi login success:", result);
    setSigningIn(false);
    setStatusMessage("Pi login succeeded. Redirecting...");
    setErrorMessage("");
    router.replace("/dashboard");
  };

  const handlePiError = (message) => {
    setSigningIn(false);
    setStatusMessage("");
    setErrorMessage(message || "Pi login failed.");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="heading-1 text-gray-900 mb-2">Originly</h1>
        <p className="text-gray-600 mb-8">
          Capture your ideas. Prove they are yours.
        </p>
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {signingIn ? "Signing in..." : "Sign in with Google"}
          </button>

          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="text-xs uppercase tracking-[0.2em] text-gray-500">or</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          <PiLoginButton onSuccess={handlePiSuccess} onError={handlePiError} />
        </div>

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