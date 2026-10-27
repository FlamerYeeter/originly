import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

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

export async function verifyPiAccessToken(accessToken, expectedUid) {
  if (typeof accessToken !== "string" || !accessToken || typeof expectedUid !== "string" || !expectedUid) {
    throw new Error("Missing Pi access token or user ID.");
  }

  const response = await fetch(`${PI_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error("Pi access token verification failed.");
  }

  const piUser = await response.json();
  if (piUser?.uid !== expectedUid) {
    throw new Error("Pi user identity mismatch.");
  }
  return piUser;
}

export async function getExpectedPiUid(decoded) {
  if (decoded.provider === "pi") {
    if (typeof decoded.linkedPiUid === "string" && decoded.linkedPiUid) {
      return decoded.linkedPiUid;
    }
    if (decoded.uid.startsWith("pi_")) {
      return decoded.uid.slice(3);
    }
  }

  const accountSnap = await adminDb.collection("linkedAccounts").doc(decoded.uid).get();
  const account = accountSnap.exists ? accountSnap.data() : null;
  return account?.status === "linked" ? account.piUid : null;
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
