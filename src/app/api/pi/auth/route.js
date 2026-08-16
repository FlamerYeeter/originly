import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const payload = await request.json();

    if (!payload || !payload.user || !payload.user.uid) {
      return NextResponse.json(
        { ok: false, error: "Invalid Pi authentication payload" },
        { status: 400 }
      );
    }

    const piUserId = payload.user.uid;
    const username = payload.user.username || "pi-user";

    // NOTE:
    // This should be replaced with your real Pi verification logic.
    // At minimum, verify the signed payload and app ID against Pi's API.
    // For now, we accept the payload and treat it as a valid server-side auth result.

    return NextResponse.json({
      ok: true,
      provider: "pi",
      user: {
        uid: piUserId,
        username,
      },
    });
  } catch (error) {
    console.error("Pi auth route error:", error);
    return NextResponse.json(
      { ok: false, error: "Unexpected Pi authentication error" },
      { status: 500 }
    );
  }
}
