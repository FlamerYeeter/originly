"use client";

import { useEffect } from "react";

export default function AuthCallbackPage() {
  useEffect(() => {
    const intentUrl = "intent://originly-two.vercel.app/auth/callback#Intent;scheme=https;package=com.example.app;end";

    const closeWindow = async () => {
      try {
        // Brief delay to ensure auth state persists
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Try to close the browser tab first.
        window.close();

        // If the browser does not close, redirect back to the app via intent.
        window.location.href = intentUrl;
      } catch (error) {
        console.error("Error closing window or redirecting to app:", error);
        window.location.href = intentUrl;
      }
    };

    closeWindow();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <p className="text-gray-600 text-lg">Signing you in...</p>
        <p className="text-sm text-gray-400 mt-2">Closing browser...</p>
        <p className="text-sm text-gray-400 mt-4">If the browser does not close, tap the button below to return to the app.</p>
        <div className="mt-3">
          <a
            href="intent://originly-two.vercel.app/auth/callback#Intent;scheme=https;package=com.example.app;end"
            className="inline-block bg-gray-900 text-white py-2 px-4 rounded-lg"
          >
            Return to app
          </a>
        </div>
      </div>
    </div>
  );
}
