import { NextResponse } from "next/server";
import {
  verifyFirebaseIdToken,
  getPiPayment,
  completePiPayment,
} from "@/lib/piServer";
import { adminDb } from "@/lib/firebaseAdmin";
import { IDEA_SUBMISSION_PRODUCT } from "@/config/payments";
import { FieldValue } from "firebase-admin/firestore";
import { rateLimit } from "@/lib/rateLimit";

/**
 * Completes an in-flight (incomplete) payment reported by the Pi SDK's
 * onIncompletePaymentFound callback. This must never silently ignore the
 * payment - it completes it server-side and records it.
 */
export async function POST(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const { limited } = rateLimit(`pi-incomplete:${ip}`, { maxRequests: 15, windowMs: 60_000 });
  if (limited) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  try {
    const decoded = await verifyFirebaseIdToken(request);
    if (!decoded) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    // The client forwards the PaymentDTO it received from the SDK.
    const { payment: incoming } = await request.json();
    const paymentId = incoming?.identifier;
    const txid = incoming?.transaction?.txid;

    if (!paymentId) {
      return NextResponse.json({ ok: false, error: "Missing payment identifier." }, { status: 400 });
    }

    // Re-fetch from Pi servers (source of truth).
    const payment = await getPiPayment(paymentId);
    const resolvedTxid = txid || payment?.transaction?.txid;

    if (!resolvedTxid) {
      // No blockchain transaction was ever submitted - nothing to complete.
      // Mark as cancelled so it doesn't block the user.
      await adminDb.collection("payments").doc(paymentId).set(
        {
          paymentId,
          firebaseUid: decoded.uid,
          status: "cancelled",
          consumed: false,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return NextResponse.json({ ok: true, status: "cancelled" });
    }

    // Complete the payment with Pi servers.
    await completePiPayment(paymentId, resolvedTxid);

    await adminDb.collection("payments").doc(paymentId).set(
      {
        paymentId,
        txid: resolvedTxid,
        piUid: payment?.user_uid || null,
        firebaseUid: decoded.uid,
        productId: payment?.metadata?.productId || IDEA_SUBMISSION_PRODUCT.productId,
        amount: Number(payment?.amount) || null,
        status: "completed",
        consumed: false,
        completedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, status: "completed", paymentId });
  } catch (error) {
    console.error("Pi incomplete route error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to resolve incomplete payment." },
      { status: 500 }
    );
  }
}
