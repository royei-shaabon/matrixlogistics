import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || !isEnvAdmin(session)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.sections).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  if (body.close) {
    await ref.update({ status: "closed", updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true });
  }

  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (body.name?.trim()) update.name = body.name.trim();
  if (body.startDateTime) update.startDateTime = body.startDateTime;
  if (body.endDateTime) update.endDateTime = body.endDateTime;

  await ref.update(update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || !isEnvAdmin(session)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.sections).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  await ref.delete();
  return NextResponse.json({ ok: true });
}
