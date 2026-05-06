import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

const WINDOW_DOC = "current";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const db = getAdminDb();
  const doc = await db.collection(COLLECTIONS.orderWindow).doc(WINDOW_DOC).get();
  if (!doc.exists) return NextResponse.json({ window: null });

  const data = doc.data()!;
  return NextResponse.json({
    window: {
      ...data,
      updatedAt: data.updatedAt?.toDate().toISOString() || null,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { start_at, end_at } = await req.json();
  if (!start_at || !end_at) {
    return NextResponse.json({ error: "נדרש תאריך התחלה וסיום" }, { status: 400 });
  }

  if (new Date(end_at) <= new Date(start_at)) {
    return NextResponse.json({ error: "זמן סיום חייב להיות אחרי זמן התחלה" }, { status: 400 });
  }

  const db = getAdminDb();
  await db.collection(COLLECTIONS.orderWindow).doc(WINDOW_DOC).set({
    windowId: randomUUID(),
    startDateTime: start_at,
    endDateTime: end_at,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: session.userId,
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { start_at, end_at } = await req.json();
  if (!start_at || !end_at) {
    return NextResponse.json({ error: "נדרש תאריך התחלה וסיום" }, { status: 400 });
  }

  if (new Date(end_at) <= new Date(start_at)) {
    return NextResponse.json({ error: "זמן סיום חייב להיות אחרי זמן התחלה" }, { status: 400 });
  }

  const db = getAdminDb();
  await db.collection(COLLECTIONS.orderWindow).doc(WINDOW_DOC).update({
    startDateTime: start_at,
    endDateTime: end_at,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: session.userId,
  });

  return NextResponse.json({ ok: true });
}
