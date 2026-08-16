import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid Pi auth payload." },
        { status: 400 }
      );
    }

    const user = body.user;
    const piUserId = user?.uid || user?.username || user?.id;

    if (!piUserId) {
      return NextResponse.json(
        { ok: false, error: "Pi auth payload missing user identity." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Pi auth verified",
      user: {
        uid: piUserId,
        username: user?.username || null,
      },
    });
  } catch (error) {
    console.error("Pi auth route error:", error);
    return NextResponse.json(
      { ok: false, error: "Pi auth failed." },
      { status: 500 }
    );
  }
}
