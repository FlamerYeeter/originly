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

export async function POST(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const { limited } = rateLimit(`pi-complete:${ip}`, { maxRequests: 15, windowMs: 60_000 });
  if (limited) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  try {
    const decoded = await verifyFirebaseIdToken(request);
    if (!decoded) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { paymentId, txid } = await request.json();
    if (!paymentId || !txid) {
      return NextResponse.json(
        { ok: false, error: "Missing paymentId or txid." },
        { status: 400 }
      );
    }

    // Fetch the payment from Pi servers (source of truth).
    const payment = await getPiPayment(paymentId);

    // Validate product + amount again at completion time.
    if (payment?.metadata?.productId !== IDEA_SUBMISSION_PRODUCT.productId) {
      return NextResponse.json(
        { ok: false, error: "Payment product mismatch." },
        { status: 400 }
      );
    }
    if (Number(payment?.amount) !== IDEA_SUBMISSION_PRODUCT.amount) {
      return NextResponse.json(
        { ok: false, error: "Payment amount mismatch." },
        { status: 400 }
      );
    }

    // Complete the payment with Pi servers.
    await completePiPayment(paymentId, txid);

    // Record the verified payment. We key the doc by paymentId to guard
    // against duplicate submissions and to allow later verification when
    // the idea is actually created.
    const paymentRef = adminDb.collection("payments").doc(paymentId);
    await paymentRef.set(
      {
        paymentId,
        txid,
        // The uid comes from the payment record returned by Pi, not the client.
        piUid: payment?.user_uid || null,
        firebaseUid: decoded.uid,
        productId: IDEA_SUBMISSION_PRODUCT.productId,
        amount: IDEA_SUBMISSION_PRODUCT.amount,
        status: "completed",
        consumed: false,
        completedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, paymentId });
  } catch (error) {
    console.error("Pi complete route error:", error);
    return NextResponse.json(
      { ok: false, error: "Payment completion failed." },
      { status: 500 }
    );
  }
}
