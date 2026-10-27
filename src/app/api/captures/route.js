import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyFirebaseIdToken } from "@/lib/piServer";
import { rateLimit } from "@/lib/rateLimit";
import { resolveCanonicalUid } from "@/lib/accountIdentity";
import { IDEA_SUBMISSION_PRODUCT } from "@/config/payments";
import {
  FREE_CAPTURE_LIMIT,
  FREE_CAPTURE_REFILL_INTERVAL_MS,
} from "@/config/captures";

function getRefilledAllowance(data, now) {
  const legacyUsed = Number.isInteger(data?.freeCapturesUsed)
    ? Math.max(0, data.freeCapturesUsed)
    : null;
  let freeCapturesRemaining = Number.isInteger(data?.freeCapturesRemaining)
    ? Math.max(0, Math.min(FREE_CAPTURE_LIMIT, data.freeCapturesRemaining))
    : legacyUsed !== null
    ? Math.max(0, FREE_CAPTURE_LIMIT - legacyUsed)
    : FREE_CAPTURE_LIMIT;
  let nextFreeCaptureAt = data?.nextFreeCaptureAt?.toMillis?.() ?? null;

  if (freeCapturesRemaining >= FREE_CAPTURE_LIMIT) {
    return { freeCapturesRemaining: FREE_CAPTURE_LIMIT, nextFreeCaptureAt: null };
  }

  if (!Number.isFinite(nextFreeCaptureAt)) {
    nextFreeCaptureAt = now + FREE_CAPTURE_REFILL_INTERVAL_MS;
  }

  while (now >= nextFreeCaptureAt && freeCapturesRemaining < FREE_CAPTURE_LIMIT) {
    freeCapturesRemaining += 1;
    nextFreeCaptureAt += FREE_CAPTURE_REFILL_INTERVAL_MS;
  }

  return {
    freeCapturesRemaining,
    nextFreeCaptureAt:
      freeCapturesRemaining === FREE_CAPTURE_LIMIT ? null : nextFreeCaptureAt,
  };
}

function getRequestIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function checkRateLimit(request, action) {
  const { limited } = rateLimit(`captures:${action}:${getRequestIp(request)}`, {
    maxRequests: 30,
    windowMs: 60_000,
  });
  return limited;
}

function toAllowanceResponse(allowance) {
  return {
    freeCapturesRemaining: allowance.freeCapturesRemaining,
    nextFreeCaptureAt: allowance.nextFreeCaptureAt
      ? new Date(allowance.nextFreeCaptureAt).toISOString()
      : null,
  };
}

export async function GET(request) {
  if (checkRateLimit(request, "status")) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  try {
    const decoded = await verifyFirebaseIdToken(request);
    if (!decoded) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const uid = await resolveCanonicalUid(decoded.uid);
    const usageSnap = await adminDb.collection("captureUsage").doc(uid).get();
    const allowance = getRefilledAllowance(usageSnap.data(), Date.now());
    return NextResponse.json({ ok: true, ...toAllowanceResponse(allowance) });
  } catch (error) {
    console.error("Capture allowance lookup failed:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to check free captures." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  if (checkRateLimit(request, "submit")) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  try {
    const decoded = await verifyFirebaseIdToken(request);
    if (!decoded) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }
    const uid = await resolveCanonicalUid(decoded.uid);

    const payload = await request.json();
    const idea = payload?.idea;
    const paymentId = payload?.paymentId || null;

    if (
      !idea ||
      typeof idea.content !== "string" ||
      !idea.content.trim() ||
      typeof idea.title !== "string" ||
      idea.title.trim().length > 120
    ) {
      return NextResponse.json({ ok: false, error: "Invalid capture content." }, { status: 400 });
    }
    if (paymentId && (typeof paymentId !== "string" || paymentId.includes("/"))) {
      return NextResponse.json({ ok: false, error: "Invalid paymentId." }, { status: 400 });
    }

    const usageRef = adminDb.collection("captureUsage").doc(uid);
    const ideaRef = adminDb.collection("users").doc(uid).collection("ideas").doc();
    const paymentRef = paymentId ? adminDb.collection("payments").doc(paymentId) : null;
    const now = Date.now();

    const result = await adminDb.runTransaction(async (transaction) => {
      const usageSnap = await transaction.get(usageRef);
      const paymentSnap = paymentRef ? await transaction.get(paymentRef) : null;
      const allowance = getRefilledAllowance(usageSnap.data(), now);

      if (!paymentId && allowance.freeCapturesRemaining === 0) {
        return {
          ok: false,
          status: 402,
          error: "No free captures remain. Please pay 1 Pi or wait for your next free capture.",
          allowance,
        };
      }

      if (paymentId) {
        if (!paymentSnap?.exists) {
          return { ok: false, status: 404, error: "Payment not found." };
        }
        const payment = paymentSnap.data();
        if (payment.firebaseUid !== uid) {
          return { ok: false, status: 403, error: "Payment does not belong to this user." };
        }
        if (
          payment.status !== "completed" ||
          payment.consumed ||
          payment.productId !== IDEA_SUBMISSION_PRODUCT.productId ||
          payment.amount !== IDEA_SUBMISSION_PRODUCT.amount
        ) {
          return { ok: false, status: 400, error: "Payment is not valid for this capture." };
        }
      }

      let updatedAllowance = allowance;
      if (!paymentId) {
        const remaining = allowance.freeCapturesRemaining - 1;
        updatedAllowance = {
          freeCapturesRemaining: remaining,
          nextFreeCaptureAt:
            allowance.nextFreeCaptureAt ??
            (remaining < FREE_CAPTURE_LIMIT ? now + FREE_CAPTURE_REFILL_INTERVAL_MS : null),
        };
      }

      const tags = Array.isArray(idea.tags)
        ? idea.tags.filter((tag) => typeof tag === "string").slice(0, 20)
        : [];
      const media = Array.isArray(idea.media)
        ? idea.media
            .filter((file) => file && typeof file.path === "string")
            .map((file) => ({
              storage: "supabase",
              bucket: "ideas",
              path: file.path,
              publicUrl: typeof file.publicUrl === "string" ? file.publicUrl : null,
              mimeType: typeof file.mimeType === "string" ? file.mimeType : null,
              size: Number.isFinite(file.size) ? file.size : null,
              name: typeof file.name === "string" ? file.name : null,
            }))
        : [];
      const location =
        idea.location &&
        Number.isFinite(idea.location.latitude) &&
        Number.isFinite(idea.location.longitude)
          ? {
              latitude: idea.location.latitude,
              longitude: idea.location.longitude,
              name: typeof idea.location.name === "string" ? idea.location.name : null,
            }
          : null;

      transaction.set(usageRef, {
        freeCapturesRemaining: updatedAllowance.freeCapturesRemaining,
        nextFreeCaptureAt: updatedAllowance.nextFreeCaptureAt
          ? Timestamp.fromMillis(updatedAllowance.nextFreeCaptureAt)
          : null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.create(ideaRef, {
        title: idea.title.trim(),
        content: idea.content.trim(),
        hash: typeof idea.hash === "string" ? idea.hash : "",
        category: typeof idea.category === "string" ? idea.category : "Idea",
        tags,
        visibility: idea.visibility === "public" ? "public" : "private",
        ownerUid: uid,
        ownerName: decoded.name || decoded.email || decoded.piUsername || "Anonymous",
        createdAt: FieldValue.serverTimestamp(),
        likes: 0,
        likedBy: [],
        paymentId,
        paymentAmount: paymentId ? IDEA_SUBMISSION_PRODUCT.amount : 0,
        captureType: paymentId ? "paid" : "free",
        originId: ideaRef.id,
        version: "v1",
        versionNumber: 1,
        ...(location ? { location } : {}),
        ...(media.length > 0 ? { media } : {}),
      });
      if (paymentRef) {
        transaction.update(paymentRef, {
          consumed: true,
          ideaId: ideaRef.id,
          consumedAt: FieldValue.serverTimestamp(),
        });
      }

      return { ok: true, ideaId: ideaRef.id, allowance: updatedAllowance };
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          ...(result.allowance ? toAllowanceResponse(result.allowance) : {}),
        },
        { status: result.status }
      );
    }

    return NextResponse.json({
      ok: true,
      ideaId: result.ideaId,
      ...toAllowanceResponse(result.allowance),
    });
  } catch (error) {
    console.error("Capture submission failed:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to save this capture. Please try again." },
      { status: 500 }
    );
  }
}
