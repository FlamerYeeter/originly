import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request) {
  // Rate limit: 5 attempts per IP per 60 seconds
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
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

    // The Pi SDK authenticate() returns { accessToken, user: { uid, username } }
    const accessToken = payload?.accessToken;
    const piUid = payload?.user?.uid;

    if (!accessToken || !piUid) {
      return NextResponse.json(
        { ok: false, error: "Invalid Pi authentication payload. Missing accessToken or user.uid." },
        { status: 400 }
      );
    }

    // Verify the Pi access token against Pi's /v2/me endpoint
    const piMeResponse = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!piMeResponse.ok) {
      return NextResponse.json(
        { ok: false, error: "Pi access token verification failed." },
        { status: 401 }
      );
    }

    const piUser = await piMeResponse.json();

    // Ensure the uid from the token matches what the client sent
    if (piUser.uid !== piUid) {
      return NextResponse.json(
        { ok: false, error: "Pi user identity mismatch." },
        { status: 401 }
      );
    }

    // Create a Firebase custom token for this Pi user
    // Prefix the uid to avoid collisions with other auth providers
    const firebaseUid = `pi_${piUser.uid}`;
    const customToken = await adminAuth.createCustomToken(firebaseUid, {
      provider: "pi",
      piUsername: piUser.username || "pi-user",
    });

    return NextResponse.json({
      ok: true,
      customToken,
      user: {
        uid: firebaseUid,
        username: piUser.username || "pi-user",
      },
    });
  } catch (error) {
    console.error("Pi auth route error:", error);
    return NextResponse.json(
      { ok: false, error: "Unexpected Pi authentication error." },
      { status: 500 }
    );
  }
}
