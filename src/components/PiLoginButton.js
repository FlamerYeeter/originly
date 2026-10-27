"use client";

import { useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function PiLoginButton({ onSuccess, onError, linkAccount = false }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePiLogin = async () => {
    if (typeof window === "undefined" || !window.Pi || typeof window.Pi.init !== "function") {
      const err = "Pi SDK is not loaded yet. Please refresh the page and try again.";
      setMessage(err);
      onError?.(err);
      return;
    }

    if (!window.__piInitialized) {
      try {
        window.Pi.init({
          version: "2.0",
          sandbox: process.env.NODE_ENV !== "production",
        });
        window.__piInitialized = true;
      } catch (error) {
        const err = "Pi Network SDK was not initialized. Call init() before any other method.";
        setMessage(err);
        onError?.(err);
        return;
      }
    }

    setLoading(true);
    setMessage("");

    try {
      const authResponse = await window.Pi.authenticate(
        ["username", "payments"],
        function onIncompletePaymentFound(payment) {
          // Handle incomplete payment - log for now
          console.warn("Incomplete payment found:", payment);
        }
      );

      const currentUser = auth.currentUser;
      if (linkAccount && !currentUser) {
        throw new Error("Sign in with Google before linking your Pi account.");
      }

      const headers = { "Content-Type": "application/json" };
      if (linkAccount) {
        headers.Authorization = `Bearer ${await currentUser.getIdToken()}`;
      }
      const response = await fetch(linkAccount ? "/api/pi/link" : "/api/pi/auth", {
        method: "POST",
        headers,
        body: JSON.stringify(authResponse),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Pi authentication failed.");
      }

      if (!linkAccount) {
        await signInWithCustomToken(auth, result.customToken);
      }

      setMessage(linkAccount ? "Pi account linked successfully." : "Pi sign-in successful");
      onSuccess?.(result);
    } catch (error) {
      const errMessage = error?.message || "Pi sign-in failed.";
      setMessage(errMessage);
      onError?.(errMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handlePiLogin}
        disabled={loading}
        className="w-full rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#14b8a6] px-4 py-3 font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? linkAccount
            ? "Linking Pi account..."
            : "Connecting to Pi..."
          : linkAccount
          ? "Link Pi Account"
          : "Continue with Pi"}
      </button>

      {message ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      ) : null}
    </div>
  );
}
