"use client";

import { useEffect } from "react";

export default function AuthCallbackPage() {
  useEffect(() => {
    const closeWindow = async () => {
      try {
        // Brief delay to ensure auth state persists
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Close the browser window
        window.close();
      } catch (error) {
        console.error("Error closing window:", error);
        // Fallback: try to go back
        window.history.back();
      }
    };

    closeWindow();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <p className="text-gray-600 text-lg">Signing you in...</p>
        <p className="text-sm text-gray-400 mt-2">Closing browser...</p>
      </div>
    </div>
  );
}
