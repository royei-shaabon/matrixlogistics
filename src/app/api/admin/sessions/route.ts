import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const db = getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.sessions)
    .orderBy("createdAt", "desc")
    .get();

  const sessions = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      windowId: data.windowId,
      status: data.status,
      startDateTime: data.startDateTime,
      endDateTime: data.endDateTime,
      createdAt: data.createdAt?.toDate().toISOString() || null,
    };
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { name, startDateTime, endDateTime } = await req.json();
  if (!name?.trim() || !startDateTime || !endDateTime) {
    return NextResponse.json({ error: "נדרש שם, תאריך התחלה וסיום" }, { status: 400 });
  }
  if (new Date(endDateTime) <= new Date(startDateTime)) {
    return NextResponse.json({ error: "זמן סיום חייב להיות אחרי זמן התחלה" }, { status: 400 });
  }

  const db = getAdminDb();
  const windowId = randomUUID();

  // Close any currently open sessions
  const openSessions = await db
    .collection(COLLECTIONS.sessions)
    .where("status", "==", "open")
    .get();
  const batch = db.batch();
  openSessions.docs.forEach((d) => batch.update(d.ref, { status: "closed" }));

  // Create the new session
  const newRef = db.collection(COLLECTIONS.sessions).doc();
  batch.set(newRef, {
    name: name.trim(),
    windowId,
    status: "open",
    startDateTime,
    endDateTime,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: session.userId,
  });

  await batch.commit();

  // Update orderWindow/current so users can submit orders
  await db.collection(COLLECTIONS.orderWindow).doc("current").set({
    windowId,
    startDateTime,
    endDateTime,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: session.userId,
  });

  return NextResponse.json({ ok: true, sessionId: newRef.id, windowId });
}
