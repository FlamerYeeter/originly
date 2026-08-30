import { adminAuth } from "@/lib/firebaseAdmin";

const PI_API_BASE = "https://api.minepi.com/v2";

/**
 * Returns the configured Pi Network server API key, or throws if missing.
 * This key is required for server-to-server payment approve/complete calls.
 */
export function getPiApiKey() {
  const key = process.env.PI_NETWORK_API_KEY;
  if (!key) {
    throw new Error(
      "PI_NETWORK_API_KEY is not configured. Add it to your server environment (.env.local)."
    );
  }
  return key;
}

/**
 * Verify a Firebase ID token sent from the client (Authorization: Bearer <token>).
 * Returns the decoded token (contains uid) or null if invalid/missing.
 */
export async function verifyFirebaseIdToken(request) {
  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    return await adminAuth.verifyIdToken(match[1]);
  } catch {
    return null;
  }
}

/**
 * Fetch a payment's server-side record from the Pi Platform API.
 * The returned payment object is the source of truth (contains the real
 * amount, metadata, and the user uid) - never trust client-supplied values.
 */
export async function getPiPayment(paymentId) {
  const res = await fetch(`${PI_API_BASE}/payments/${paymentId}`, {
    headers: { Authorization: `Key ${getPiApiKey()}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Pi payment ${paymentId} (status ${res.status}).`);
  }
  return res.json();
}

/**
 * Approve a payment server-side. Required before the user signs the transaction.
 */
export async function approvePiPayment(paymentId) {
  const res = await fetch(`${PI_API_BASE}/payments/${paymentId}/approve`, {
    method: "POST",
    headers: { Authorization: `Key ${getPiApiKey()}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Pi approve failed (status ${res.status}): ${body}`);
  }
  return res.json();
}

/**
 * Complete a payment server-side after the blockchain transaction is submitted.
 */
export async function completePiPayment(paymentId, txid) {
  const res = await fetch(`${PI_API_BASE}/payments/${paymentId}/complete`, {
    method: "POST",
    headers: {
      Authorization: `Key ${getPiApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ txid }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Pi complete failed (status ${res.status}): ${body}`);
  }
  return res.json();
}
