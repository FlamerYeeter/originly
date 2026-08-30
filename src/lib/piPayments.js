import { auth } from "@/lib/firebase";
import { buildIdeaSubmissionPaymentData } from "@/config/payments";

/**
 * Ensures the Pi SDK is loaded and initialized before any payment call.
 * Returns true if ready, throws with a helpful message otherwise.
 */
export async function ensurePiReady() {
  if (typeof window === "undefined" || !window.Pi || typeof window.Pi.init !== "function") {
    throw new Error("Pi SDK is not loaded. Open this app in the Pi Browser and try again.");
  }
  if (!window.__piInitialized) {
    await window.Pi.init({
      version: "2.0",
      sandbox: process.env.NODE_ENV !== "production",
    });
    window.__piInitialized = true;
  }
  return true;
}

/**
 * Gets the current user's Firebase ID token for authenticating API calls.
 */
async function getAuthHeader() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be signed in to make a payment.");
  }
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

/**
 * Callback the Pi SDK invokes when it finds an incomplete payment.
 * Forwards it to the backend to be completed (never silently ignored).
 */
export async function onIncompletePaymentFound(payment) {
  try {
    const headers = await getAuthHeader();
    await fetch("/api/pi/payments/incomplete", {
      method: "POST",
      headers,
      body: JSON.stringify({ payment }),
    });
  } catch (err) {
    console.error("Failed to resolve incomplete payment:", err);
  }
}

/**
 * Runs the full U2A payment flow for an idea submission.
 * Resolves with the verified paymentId once the payment is completed
 * server-side, or rejects on cancel/error.
 */
export async function payForIdeaSubmission() {
  await ensurePiReady();

  const paymentData = buildIdeaSubmissionPaymentData();

  return new Promise((resolve, reject) => {
    let resolvedPaymentId = null;

    window.Pi.createPayment(paymentData, {
      onReadyForServerApproval: async (paymentId) => {
        resolvedPaymentId = paymentId;
        try {
          const headers = await getAuthHeader();
          const res = await fetch("/api/pi/payments/approve", {
            method: "POST",
            headers,
            body: JSON.stringify({ paymentId }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            reject(new Error(body.error || "Payment approval failed."));
          }
        } catch (err) {
          reject(err);
        }
      },

      onReadyForServerCompletion: async (paymentId, txid) => {
        try {
          const headers = await getAuthHeader();
          const res = await fetch("/api/pi/payments/complete", {
            method: "POST",
            headers,
            body: JSON.stringify({ paymentId, txid }),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok || !body.ok) {
            reject(new Error(body.error || "Payment completion failed."));
            return;
          }
          resolve(paymentId);
        } catch (err) {
          reject(err);
        }
      },

      onCancel: (paymentId) => {
        reject(new Error("Payment was cancelled."));
      },

      onError: (error, payment) => {
        reject(new Error(error?.message || "Payment failed."));
      },
    });
  });
}

/**
 * Verifies (server-side) that a completed payment can be used for an idea,
 * and marks it as consumed so it cannot be reused.
 */
export async function consumePayment(paymentId, ideaId) {
  const headers = await getAuthHeader();
  const res = await fetch("/api/pi/payments/consume", {
    method: "POST",
    headers,
    body: JSON.stringify({ paymentId, ideaId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) {
    throw new Error(body.error || "Payment verification failed.");
  }
  return true;
}
