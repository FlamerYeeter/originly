import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyPiAccessToken } from "@/lib/piServer";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { limited, retryAfterMs } = rateLimit(`pi-auth:${ip}`, {
    maxRequests: 5,
    windowMs: 60_000,
  });
  if (limited) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      }
    );
  }

  try {
    const payload = await request.json();
    if (!payload?.accessToken || !payload?.user?.uid) {
      return NextResponse.json(
        { ok: false, error: "Invalid Pi authentication payload. Missing accessToken or user.uid." },
        { status: 400 }
      );
    }
    const piUser = await verifyPiAccessToken(payload?.accessToken, payload?.user?.uid);
    const piFirebaseUid = `pi_${piUser.uid}`;
    const identitySnap = await adminDb.collection("accountIdentityLinks").doc(piFirebaseUid).get();
    const identity = identitySnap.exists ? identitySnap.data() : null;

    if (identity?.status === "linking") {
      return NextResponse.json(
        { ok: false, error: "Pi account linking is in progress. Please try again shortly." },
        { status: 409 }
      );
    }

    const firebaseUid =
      identity?.status === "linked" ? identity.primaryUid : piFirebaseUid;
    const customToken = await adminAuth.createCustomToken(firebaseUid, {
      provider: "pi",
      piUsername: piUser.username || "pi-user",
      ...(identity?.status === "linked" ? { linkedPiUid: piUser.uid } : {}),
    });

    return NextResponse.json({
      ok: true,
      customToken,
      user: {
        uid: firebaseUid,
        username: piUser.username || "pi-user",
        linked: identity?.status === "linked",
      },
    });
  } catch (error) {
    console.error("Pi auth route error:", error);
    const status =
      error?.message === "Pi access token verification failed." ||
      error?.message === "Pi user identity mismatch."
        ? 401
        : 500;
    return NextResponse.json(
      {
        ok: false,
        error: status === 401 ? error.message : "Unexpected Pi authentication error.",
      },
      { status }
    );
  }
}
