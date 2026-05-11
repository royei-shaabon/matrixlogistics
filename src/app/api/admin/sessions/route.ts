import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  const session = await getSession();
  if (!session || !isEnvAdmin(session) || !session.currentEnvironmentId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const db = getAdminDb();
  const snap = await db
    .collection(COLLECTIONS.sections)
    .where("environmentId", "==", session.currentEnvironmentId)
    .get();

  const sessions = snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name,
        // normalize: Firestore stores "active", frontend expects "open"
        status: data.status === "active" ? "open" : data.status,
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
        createdAt: data.createdAt?.toDate().toISOString() || null,
      };
    })
    .sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.localeCompare(a.createdAt);
    });

  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isEnvAdmin(session) || !session.currentEnvironmentId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { name, startDateTime, endDateTime } = await req.json();
  if (!name?.trim() || !startDateTime || !endDateTime) {
    return NextResponse.json({ error: "נדרש שם, תאריך התחלה וסיום" }, { status: 400 });
  }
  if (new Date(endDateTime) <= new Date(startDateTime)) {
    return NextResponse.json({ error: "זמן סיום חייב להיות אחרי זמן התחלה" }, { status: 400 });
  }

  const envId = session.currentEnvironmentId;
  const db = getAdminDb();

  // Close any open sections in this environment
  const openSnap = await db
    .collection(COLLECTIONS.sections)
    .where("environmentId", "==", envId)
    .where("status", "==", "active")
    .get();

  const batch = db.batch();
  openSnap.docs.forEach((d) => batch.update(d.ref, { status: "closed", updatedAt: FieldValue.serverTimestamp() }));

  const newRef = db.collection(COLLECTIONS.sections).doc();
  batch.set(newRef, {
    environmentId: envId,
    name: name.trim(),
    status: "active",
    startDateTime,
    endDateTime,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: session.userId,
  });

  await batch.commit();
  return NextResponse.json({ ok: true, sessionId: newRef.id });
}
