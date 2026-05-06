import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const db = getAdminDb();
  const windowDoc = await db.collection(COLLECTIONS.orderWindow).doc("current").get();
  const windowId = windowDoc.exists ? windowDoc.data()!.windowId : null;

  const snap = await db
    .collection(COLLECTIONS.sections)
    .orderBy("createdAt", "desc")
    .get();

  const sections = snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate().toISOString() }));
  return NextResponse.json({ sections, windowId });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "שם נדרש" }, { status: 400 });

  const db = getAdminDb();
  const windowDoc = await db.collection(COLLECTIONS.orderWindow).doc("current").get();
  const windowId = windowDoc.exists ? windowDoc.data()!.windowId : null;

  const ref = await db.collection(COLLECTIONS.sections).add({
    name: name.trim(),
    status: "archived",
    windowId,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: session.userId,
  });

  return NextResponse.json({ ok: true, id: ref.id });
}
