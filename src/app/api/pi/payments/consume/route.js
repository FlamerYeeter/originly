import { NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "@/lib/piServer";
import { adminDb } from "@/lib/firebaseAdmin";
import { IDEA_SUBMISSION_PRODUCT } from "@/config/payments";
import { FieldValue } from "firebase-admin/firestore";
import { rateLimit } from "@/lib/rateLimit";

/**
 * Marks a completed payment as consumed and links it to a submitted idea.
 * Uses a Firestore transaction to prevent the same payment being reused
 * for more than one idea (duplicate/replay protection).
 */
export async function POST(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const { limited } = rateLimit(`pi-consume:${ip}`, { maxRequests: 15, windowMs: 60_000 });
  if (limited) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  try {
    const decoded = await verifyFirebaseIdToken(request);
    if (!decoded) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { paymentId, ideaId } = await request.json();
    if (!paymentId) {
      return NextResponse.json({ ok: false, error: "Missing paymentId." }, { status: 400 });
    }

    const paymentRef = adminDb.collection("payments").doc(paymentId);

    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(paymentRef);
      if (!snap.exists) {
        return { ok: false, status: 404, error: "Payment not found." };
      }
      const data = snap.data();

      // The payment must belong to the requesting user.
      if (data.firebaseUid !== decoded.uid) {
        return { ok: false, status: 403, error: "Payment does not belong to this user." };
      }
      if (data.status !== "completed") {
        return { ok: false, status: 400, error: "Payment is not completed." };
      }
      if (data.productId !== IDEA_SUBMISSION_PRODUCT.productId) {
        return { ok: false, status: 400, error: "Payment product mismatch." };
      }
      if (data.consumed) {
        return { ok: false, status: 409, error: "Payment has already been used." };
      }

      tx.update(paymentRef, {
        consumed: true,
        ideaId: ideaId || null,
        consumedAt: FieldValue.serverTimestamp(),
      });

      return { ok: true };
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Pi consume route error:", error);
    return NextResponse.json(
      { ok: false, error: "Payment verification failed." },
      { status: 500 }
    );
  }
}
