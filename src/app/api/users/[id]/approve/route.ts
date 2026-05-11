import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// POST — approve a member in the current environment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !isEnvAdmin(session) || !session.currentEnvironmentId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const db = getAdminDb();

  // Find member record
  const memberId = body.memberId;
  if (memberId) {
    await db.collection(COLLECTIONS.environmentMembers).doc(memberId).update({
      status: "approved",
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    const snap = await db
      .collection(COLLECTIONS.environmentMembers)
      .where("environmentId", "==", session.currentEnvironmentId)
      .where("userId", "==", id)
      .limit(1)
      .get();
    if (snap.empty) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
    await snap.docs[0].ref.update({ status: "approved", updatedAt: FieldValue.serverTimestamp() });
  }

  return NextResponse.json({ ok: true });
}
