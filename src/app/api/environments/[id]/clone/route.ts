import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.globalRole !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, includeUsers } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "שם סביבה נדרש" }, { status: 400 });

  const db = getAdminDb();
  const now = FieldValue.serverTimestamp();

  const sourceEnv = await db.collection(COLLECTIONS.environments).doc(id).get();
  if (!sourceEnv.exists) return NextResponse.json({ error: "סביבה לא נמצאה" }, { status: 404 });
  const sourceData = sourceEnv.data()!;

  const newEnvRef = await db.collection(COLLECTIONS.environments).add({
    name: name.trim(),
    description: sourceData.description || "",
    ownerUserId: session.userId,
    status: "active",
    inviteCode: randomUUID(),
    requireApproval: sourceData.requireApproval ?? true,
    createdAt: now,
    updatedAt: now,
  });
  const newEnvId = newEnvRef.id;

  const [itemsSnap, membersSnap] = await Promise.all([
    db.collection(COLLECTIONS.items).where("environmentId", "==", id).get(),
    includeUsers
      ? db.collection(COLLECTIONS.environmentMembers)
          .where("environmentId", "==", id)
          .where("status", "==", "approved")
          .get()
      : Promise.resolve(null),
  ]);

  const totalOps = 1 + itemsSnap.size + (membersSnap ? membersSnap.size : 0);
  if (totalOps > 499) {
    return NextResponse.json({ error: "הסביבה גדולה מדי לשכפול (מעל 499 פריטים/חברים)" }, { status: 400 });
  }

  const batch = db.batch();

  // Add creator as admin
  batch.set(db.collection(COLLECTIONS.environmentMembers).doc(), {
    environmentId: newEnvId,
    userId: session.userId,
    role: "environment_admin",
    status: "approved",
    joinedAt: now,
    updatedAt: now,
  });

  // Clone items
  itemsSnap.docs.forEach((doc) => {
    const { environmentId: _eid, createdAt: _ca, updatedAt: _ua, ...rest } = doc.data();
    batch.set(db.collection(COLLECTIONS.items).doc(), {
      ...rest,
      environmentId: newEnvId,
      createdAt: now,
      updatedAt: now,
    });
  });

  // Clone members (skip current user — already added as admin above)
  if (membersSnap) {
    membersSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.userId === session.userId) return;
      batch.set(db.collection(COLLECTIONS.environmentMembers).doc(), {
        environmentId: newEnvId,
        userId: data.userId,
        role: data.role,
        status: "approved",
        joinedAt: now,
        updatedAt: now,
      });
    });
  }

  await batch.commit();

  return NextResponse.json({
    id: newEnvId,
    itemCount: itemsSnap.size,
    memberCount: membersSnap ? membersSnap.size : 0,
  }, { status: 201 });
}
