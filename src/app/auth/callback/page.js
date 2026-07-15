"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";

export default function AuthCallbackPage() {
  useEffect(() => {
    const closeAndReturn = async () => {
      try {
        // Brief delay to ensure auth state updates
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Signal the app that auth is complete
        await App.exitApp();
      } catch (error) {
        console.error("Error closing browser:", error);
        window.close();
      }
    };

    closeAndReturn();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Signing you in...</p>
        <p className="text-sm text-gray-400 mt-2">Closing browser...</p>
      </div>
    </div>
  );
}
