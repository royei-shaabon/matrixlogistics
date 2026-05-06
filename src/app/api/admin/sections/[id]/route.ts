import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const db = getAdminDb();

  // Rename
  if (body.name !== undefined) {
    await db.collection(COLLECTIONS.sections).doc(id).update({ name: body.name.trim() });
  }

  // Activate: set this one active, archive all others in the same windowId
  if (body.activate) {
    const sectionDoc = await db.collection(COLLECTIONS.sections).doc(id).get();
    if (!sectionDoc.exists) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
    const windowId = sectionDoc.data()!.windowId;

    // Archive all others in same window
    const others = await db
      .collection(COLLECTIONS.sections)
      .where("windowId", "==", windowId)
      .where("status", "==", "active")
      .get();
    const batch = db.batch();
    others.docs.forEach((d) => { if (d.id !== id) batch.update(d.ref, { status: "archived" }); });
    batch.update(db.collection(COLLECTIONS.sections).doc(id), { status: "active" });
    await batch.commit();
  }

  // Archive
  if (body.archive) {
    await db.collection(COLLECTIONS.sections).doc(id).update({ status: "archived" });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  await getAdminDb().collection(COLLECTIONS.sections).doc(id).delete();
  return NextResponse.json({ ok: true });
}
