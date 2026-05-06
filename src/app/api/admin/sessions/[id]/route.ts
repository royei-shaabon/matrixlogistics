import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.sessions).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  if (body.close) {
    await ref.update({ status: "closed", closedAt: FieldValue.serverTimestamp() });

    // If this was the current active session, push orderWindow endDateTime to now to close it
    const windowDoc = await db.collection(COLLECTIONS.orderWindow).doc("current").get();
    if (windowDoc.exists && windowDoc.data()!.windowId === doc.data()!.windowId) {
      await db.collection(COLLECTIONS.orderWindow).doc("current").update({
        endDateTime: new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.name?.trim()) {
    await ref.update({ name: body.name.trim() });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "לא צוינה פעולה" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.sessions).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const windowId = doc.data()!.windowId;

  // Check if any orders exist for this session
  const ordersSnap = await db
    .collection(COLLECTIONS.orders)
    .where("windowId", "==", windowId)
    .limit(1)
    .get();
  if (!ordersSnap.empty) {
    return NextResponse.json({ error: "לא ניתן למחוק סשן עם הזמנות קיימות" }, { status: 400 });
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
