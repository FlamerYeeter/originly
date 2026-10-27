import { adminDb } from "@/lib/firebaseAdmin";

export async function resolveCanonicalUid(firebaseUid) {
  const identity = await adminDb.collection("accountIdentityLinks").doc(firebaseUid).get();
  const data = identity.exists ? identity.data() : null;
  return data?.status === "linked" ? data.primaryUid : firebaseUid;
}
