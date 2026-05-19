import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (session.globalRole !== "super_admin" && session.currentEnvironmentId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getAdminDb();
  const doc = await db.collection(COLLECTIONS.environments).doc(id).get();
  if (!doc.exists) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const data = doc.data()!;
  // Never expose inviteCode to non-super-admins
  if (session.globalRole !== "super_admin") {
    delete (data as Record<string, unknown>).inviteCode;
  }

  return NextResponse.json({ id: doc.id, ...data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const isSuperAdmin = session.globalRole === "super_admin";
  const isOwnEnvAdmin = session.currentEnvironmentId === id && isEnvAdmin(session);

  if (!isSuperAdmin && !isOwnEnvAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (body.name) update.name = body.name.trim();
  if (body.description !== undefined) update.description = body.description.trim();
  if (body.status && isSuperAdmin) update.status = body.status;
  if (body.requireApproval !== undefined && (isSuperAdmin || isOwnEnvAdmin)) {
    update.requireApproval = Boolean(body.requireApproval);
  }

  const db = getAdminDb();
  await db.collection(COLLECTIONS.environments).doc(id).update(update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.globalRole !== "super_admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  const db = getAdminDb();

  // Delete all members
  const membersSnap = await db.collection(COLLECTIONS.environmentMembers).where("environmentId", "==", id).get();
  const batch = db.batch();
  membersSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  await db.collection(COLLECTIONS.environments).doc(id).delete();
  return NextResponse.json({ ok: true });
}
