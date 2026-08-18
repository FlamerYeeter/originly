import "./globals.css";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata = {
  title: "Originly",
  description: "Capture and prove ownership of your ideas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background min-h-screen text-foreground">
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="afterInteractive"
          onLoad={() => {
            if (typeof window !== "undefined" && window.Pi && typeof window.Pi.init === "function") {
              window.Pi.init({
                version: "2.0",
                sandbox: process.env.NODE_ENV !== "production",
              });
              window.__piInitialized = true;
            }
          }}
        />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}