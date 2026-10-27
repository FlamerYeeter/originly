import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyFirebaseIdToken, verifyPiAccessToken } from "@/lib/piServer";
import { rateLimit } from "@/lib/rateLimit";
import { FREE_CAPTURE_LIMIT } from "@/config/captures";

const BATCH_SIZE = 450;

function isGoogleAccount(user) {
  return user.providerData.some((provider) => provider.providerId === "google.com");
}

function getIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function copyPiVault(sourceUid, targetUid) {
  const sourceIdeas = await adminDb.collection("users").doc(sourceUid).collection("ideas").get();

  for (const sourceIdea of sourceIdeas.docs) {
    const targetIdeaRef = adminDb
      .collection("users")
      .doc(targetUid)
      .collection("ideas")
      .doc(sourceIdea.id);
    const targetIdea = await targetIdeaRef.get();
    if (targetIdea.exists && targetIdea.data().linkedFromUid !== sourceUid) {
      const error = new Error("An idea ID conflicts with an existing idea in this vault.");
      error.code = "account-link-conflict";
      throw error;
    }
  }

  for (const sourceIdea of sourceIdeas.docs) {
    const targetIdeaRef = adminDb
      .collection("users")
      .doc(targetUid)
      .collection("ideas")
      .doc(sourceIdea.id);
    const targetIdea = await targetIdeaRef.get();
    const operations = targetIdea.exists
      ? []
      : [{
          ref: targetIdeaRef,
          data: { ...sourceIdea.data(), ownerUid: targetUid, linkedFromUid: sourceUid },
        }];
    const sourceVersions = await sourceIdea.ref.collection("versions").get();
    for (const sourceVersion of sourceVersions.docs) {
      operations.push({
        ref: targetIdeaRef.collection("versions").doc(sourceVersion.id),
        data: { ...sourceVersion.data(), linkedFromUid: sourceUid },
      });
    }

    for (let offset = 0; offset < operations.length; offset += BATCH_SIZE) {
      const batch = adminDb.batch();
      for (const operation of operations.slice(offset, offset + BATCH_SIZE)) {
        batch.set(operation.ref, operation.data);
      }
      await batch.commit();
    }
  }

  const sharedIdeas = await adminDb
    .collection("sharedIdeas")
    .where("ownerUid", "==", sourceUid)
    .get();
  for (let offset = 0; offset < sharedIdeas.docs.length; offset += BATCH_SIZE) {
    const batch = adminDb.batch();
    for (const sharedIdea of sharedIdeas.docs.slice(offset, offset + BATCH_SIZE)) {
      batch.update(sharedIdea.ref, { ownerUid: targetUid });
    }
    await batch.commit();
  }

  const sourcePayments = await adminDb
    .collection("payments")
    .where("firebaseUid", "==", sourceUid)
    .get();
  for (let offset = 0; offset < sourcePayments.docs.length; offset += BATCH_SIZE) {
    const batch = adminDb.batch();
    for (const payment of sourcePayments.docs.slice(offset, offset + BATCH_SIZE)) {
      batch.update(payment.ref, { firebaseUid: targetUid });
    }
    await batch.commit();
  }
}

async function mergeCaptureUsage(identityRef, sourceUid, targetUid) {
  const sourceUsageRef = adminDb.collection("captureUsage").doc(sourceUid);
  const targetUsageRef = adminDb.collection("captureUsage").doc(targetUid);

  await adminDb.runTransaction(async (transaction) => {
    const [identitySnap, sourceSnap, targetSnap] = await Promise.all([
      transaction.get(identityRef),
      transaction.get(sourceUsageRef),
      transaction.get(targetUsageRef),
    ]);
    if (!identitySnap.exists || identitySnap.data().primaryUid !== targetUid) {
      throw new Error("Account link ownership changed during linking.");
    }
    if (identitySnap.data().usageMerged) return;

    const source = sourceSnap.data() || {};
    const target = targetSnap.data() || {};
    const getRemaining = (usage) => {
      if (Number.isInteger(usage.freeCapturesRemaining)) {
        return Math.max(0, Math.min(FREE_CAPTURE_LIMIT, usage.freeCapturesRemaining));
      }
      if (Number.isInteger(usage.freeCapturesUsed)) {
        return Math.max(0, FREE_CAPTURE_LIMIT - Math.max(0, usage.freeCapturesUsed));
      }
      return FREE_CAPTURE_LIMIT;
    };
    const sourceRemaining = getRemaining(source);
    const targetRemaining = getRemaining(target);
    const freeCapturesRemaining = Math.min(sourceRemaining, targetRemaining);
    const nextFreeCaptureAt = [
      source.nextFreeCaptureAt?.toMillis?.(),
      target.nextFreeCaptureAt?.toMillis?.(),
    ]
      .filter(Number.isFinite)
      .sort((a, b) => b - a)[0] || null;

    transaction.set(
      targetUsageRef,
      {
        freeCapturesRemaining,
        nextFreeCaptureAt:
          freeCapturesRemaining === FREE_CAPTURE_LIMIT ? null : nextFreeCaptureAt,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    transaction.set(sourceUsageRef, { mergedInto: targetUid }, { merge: true });
    transaction.update(identityRef, { usageMerged: true });
  });
}

async function releaseUnfinishedLink(identityRef, linkedAccountRef, primaryUid) {
  await adminDb.runTransaction(async (transaction) => {
    const [identitySnap, linkedAccountSnap] = await Promise.all([
      transaction.get(identityRef),
      transaction.get(linkedAccountRef),
    ]);
    if (
      identitySnap.exists &&
      identitySnap.data().primaryUid === primaryUid &&
      identitySnap.data().status === "linking"
    ) {
      transaction.delete(identityRef);
      if (
        linkedAccountSnap.exists &&
        linkedAccountSnap.data().status === "linking" &&
        linkedAccountSnap.data().piUid === identitySnap.data().piUid
      ) {
        transaction.delete(linkedAccountRef);
      }
    }
  });
}

export async function GET(request) {
  const { limited } = rateLimit(`pi-link-status:${getIp(request)}`, {
    maxRequests: 30,
    windowMs: 60_000,
  });
  if (limited) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  try {
    const decoded = await verifyFirebaseIdToken(request);
    if (!decoded) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }
    const user = await adminAuth.getUser(decoded.uid);
    if (!isGoogleAccount(user)) {
      return NextResponse.json(
        { ok: false, error: "Sign in with Google to manage a linked Pi account." },
        { status: 403 }
      );
    }

    const accountSnap = await adminDb.collection("linkedAccounts").doc(decoded.uid).get();
    const account = accountSnap.exists ? accountSnap.data() : {};
    return NextResponse.json({
      ok: true,
      linked: account.status === "linked",
      piUsername: account.status === "linked" ? account.piUsername : null,
    });
  } catch (error) {
    console.error("Pi account link status error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to check Pi account link." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { limited } = rateLimit(`pi-link:${getIp(request)}`, {
    maxRequests: 5,
    windowMs: 60_000,
  });
  if (limited) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let identityRef;
  let linkedAccountRef;
  let primaryUid;
  try {
    const decoded = await verifyFirebaseIdToken(request);
    if (!decoded) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }
    const googleUser = await adminAuth.getUser(decoded.uid);
    if (!isGoogleAccount(googleUser)) {
      return NextResponse.json(
        { ok: false, error: "Sign in with Google before linking a Pi account." },
        { status: 403 }
      );
    }

    const payload = await request.json();
    const piUser = await verifyPiAccessToken(payload?.accessToken, payload?.user?.uid);
    const sourceUid = `pi_${piUser.uid}`;
    primaryUid = decoded.uid;
    if (sourceUid === primaryUid) {
      return NextResponse.json({ ok: false, error: "This Pi identity is already in use." }, { status: 400 });
    }

    identityRef = adminDb.collection("accountIdentityLinks").doc(sourceUid);
    linkedAccountRef = adminDb.collection("linkedAccounts").doc(primaryUid);
    const state = await adminDb.runTransaction(async (transaction) => {
      const [identitySnap, accountSnap] = await Promise.all([
        transaction.get(identityRef),
        transaction.get(linkedAccountRef),
      ]);
      const account = accountSnap.exists ? accountSnap.data() : {};
      if (account.piUid && account.piUid !== piUser.uid) {
        return { ok: false, conflict: true };
      }
      if (identitySnap.exists) {
        const identity = identitySnap.data();
        if (identity.primaryUid !== primaryUid) return { ok: false, conflict: true };
        if (identity.status === "linked") return { ok: true, alreadyLinked: true };
        if (identity.status === "linking") return { ok: true, resume: true };
      }

      transaction.set(identityRef, {
        primaryUid,
        piUid: piUser.uid,
        piUsername: piUser.username || "pi-user",
        status: "linking",
        usageMerged: false,
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.set(
        linkedAccountRef,
        {
          piUid: piUser.uid,
          piUsername: piUser.username || "pi-user",
          status: "linking",
        },
        { merge: true }
      );
      return { ok: true };
    });

    if (!state.ok) {
      return NextResponse.json(
        { ok: false, error: "That Pi account is already linked to a different Originly account." },
        { status: 409 }
      );
    }
    if (state.alreadyLinked) {
      return NextResponse.json({ ok: true, linked: true, piUsername: piUser.username || "pi-user" });
    }

    await copyPiVault(sourceUid, primaryUid);
    await mergeCaptureUsage(identityRef, sourceUid, primaryUid);
    await adminDb.runTransaction(async (transaction) => {
      const identitySnap = await transaction.get(identityRef);
      if (!identitySnap.exists || identitySnap.data().primaryUid !== primaryUid) {
        throw new Error("Account link ownership changed during linking.");
      }
      transaction.update(identityRef, { status: "linked", linkedAt: FieldValue.serverTimestamp() });
      transaction.set(
        linkedAccountRef,
        {
          piUid: piUser.uid,
          piUsername: piUser.username || "pi-user",
          status: "linked",
          linkedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    return NextResponse.json({ ok: true, linked: true, piUsername: piUser.username || "pi-user" });
  } catch (error) {
    console.error("Pi account linking error:", error);
    if (error?.code === "account-link-conflict" && identityRef && linkedAccountRef && primaryUid) {
      try {
        await releaseUnfinishedLink(identityRef, linkedAccountRef, primaryUid);
      } catch (cleanupError) {
        console.error("Failed to release conflicting Pi account link:", cleanupError);
      }
      return NextResponse.json(
        { ok: false, error: "An existing idea conflicts with this vault. No account link was created." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to link the Pi account." },
      { status: 500 }
    );
  }
}
