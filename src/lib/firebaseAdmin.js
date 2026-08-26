import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // If a service account JSON is provided via env var, use it.
  // Handles both single-line and multi-line JSON in the env var.
  let serviceAccount;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    try {
      serviceAccount = JSON.parse(raw);
    } catch {
      // If multi-line JSON broke the parse, try collapsing whitespace
      try {
        serviceAccount = JSON.parse(raw.replace(/\n/g, "\\n").replace(/\r/g, ""));
      } catch {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it is valid JSON.");
      }
    }
  }

  const app = initializeApp(
    serviceAccount
      ? { credential: cert(serviceAccount) }
      : { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID }
  );

  return app;
}

const adminApp = getFirebaseAdmin();
export const adminAuth = getAuth(adminApp);
