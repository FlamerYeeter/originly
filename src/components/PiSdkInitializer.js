"use client";

import Script from "next/script";
import { PI_SANDBOX } from "@/lib/piNetwork";

export default function PiSdkInitializer() {
  return (
    <Script
      src="https://sdk.minepi.com/pi-sdk.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== "undefined" && window.Pi && typeof window.Pi.init === "function") {
          window.Pi.init({
            version: "2.0",
            sandbox: PI_SANDBOX,
          });
          window.__piInitialized = true;
        }
      }}
    />
  );
}
