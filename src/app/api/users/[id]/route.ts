import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, getAdminAuth, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// PATCH — update user profile (global) or membership (env-scoped)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !isEnvAdmin(session)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const db = getAdminDb();

  // Update membership if memberId provided
  if (body.memberId) {
    const memberUpdate: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (body.memberStatus) memberUpdate.status = body.memberStatus;
    if (body.memberRole) memberUpdate.role = body.memberRole;
    await db.collection(COLLECTIONS.environmentMembers).doc(body.memberId).update(memberUpdate);
  }

  // Update global user fields (super_admin only for sensitive fields)
  const userUpdate: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (body.fullName !== undefined) userUpdate.fullName = body.fullName;
  if (body.phoneNumber !== undefined) userUpdate.phoneNumber = body.phoneNumber;
  if (body.globalStatus !== undefined && session.globalRole === "super_admin") {
    userUpdate.globalStatus = body.globalStatus;
  }
  if (body.globalRole !== undefined && session.globalRole === "super_admin") {
    userUpdate.globalRole = body.globalRole;
  }

  if (Object.keys(userUpdate).length > 1) {
    await db.collection(COLLECTIONS.users).doc(id).update(userUpdate);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.globalRole !== "super_admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  const db = getAdminDb();
  const auth = getAdminAuth();

  await db.collection(COLLECTIONS.users).doc(id).delete();
  try { await auth.deleteUser(id); } catch { /* ignore */ }

  return NextResponse.json({ ok: true });
}
