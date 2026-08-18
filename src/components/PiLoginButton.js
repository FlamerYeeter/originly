"use client";

import { useEffect, useState } from "react";

export default function PiLoginButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.Pi) {
      return;
    }

    try {
      window.Pi.init({
        version: "2.0",
        sandbox: process.env.NODE_ENV !== "production",
      });
      setReady(true);
    } catch (error) {
      console.error("Pi SDK initialization failed:", error);
      const err = "Pi Network SDK could not be initialized.";
      setMessage(err);
      onError?.(err);
    }
  }, [onError]);

  const handlePiLogin = async () => {
    if (!window.Pi) {
      const err = "Pi SDK is not loaded yet. Please refresh the page and try again.";
      setMessage(err);
      onError?.(err);
      return;
    }

    if (!ready) {
      try {
        window.Pi.init({
          version: "2.0",
          sandbox: process.env.NODE_ENV !== "production",
        });
        setReady(true);
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
      const authResponse = await window.Pi.authenticate({
        scopes: ["username", "payments"],
      });

      const response = await fetch("/api/pi/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(authResponse),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Pi authentication failed.");
      }

      setMessage("Pi sign-in successful");
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
        {loading ? "Connecting to Pi..." : "Continue with Pi"}
      </button>

      {message ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      ) : null}
    </div>
  );
}
