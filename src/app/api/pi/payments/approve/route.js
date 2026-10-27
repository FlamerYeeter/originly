import { NextResponse } from "next/server";
import {
  verifyFirebaseIdToken,
  getPiPayment,
  approvePiPayment,
  getExpectedPiUid,
} from "@/lib/piServer";
import { IDEA_SUBMISSION_PRODUCT } from "@/config/payments";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const { limited } = rateLimit(`pi-approve:${ip}`, { maxRequests: 15, windowMs: 60_000 });
  if (limited) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  try {
    // Require an authenticated Firebase user
    const decoded = await verifyFirebaseIdToken(request);
    if (!decoded) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { paymentId } = await request.json();
    if (!paymentId) {
      return NextResponse.json({ ok: false, error: "Missing paymentId." }, { status: 400 });
    }

    // Fetch the payment from Pi servers (source of truth) and validate the product/amount.
    const payment = await getPiPayment(paymentId);
    const expectedPiUid = await getExpectedPiUid(decoded);
    if (!expectedPiUid) {
      return NextResponse.json(
        { ok: false, error: "Link your Pi account from the dashboard before paying." },
        { status: 403 }
      );
    }
    if (payment?.user_uid !== expectedPiUid) {
      return NextResponse.json({ ok: false, error: "Pi payment account mismatch." }, { status: 403 });
    }

    const expectedAmount = IDEA_SUBMISSION_PRODUCT.amount;
    const paymentAmount = Number(payment?.amount);
    const productId = payment?.metadata?.productId;

    if (productId !== IDEA_SUBMISSION_PRODUCT.productId) {
      return NextResponse.json(
        { ok: false, error: "Payment product mismatch." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(paymentAmount) || paymentAmount !== expectedAmount) {
      return NextResponse.json(
        { ok: false, error: "Payment amount mismatch." },
        { status: 400 }
      );
    }

    // Approve with Pi servers
    await approvePiPayment(paymentId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Pi approve route error:", error);
    return NextResponse.json(
      { ok: false, error: "Payment approval failed." },
      { status: 500 }
    );
  }
}
