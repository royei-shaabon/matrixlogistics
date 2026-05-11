import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// GET — list members of environment
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (session.globalRole !== "super_admin" && session.currentEnvironmentId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isEnvAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getAdminDb();
  const membersSnap = await db
    .collection(COLLECTIONS.environmentMembers)
    .where("environmentId", "==", id)
    .get();

  if (membersSnap.empty) return NextResponse.json({ members: [] });

  const userIds = [...new Set(membersSnap.docs.map((d) => d.data().userId as string))];
  const userDocs = await Promise.all(
    userIds.map((uid) => db.collection(COLLECTIONS.users).doc(uid).get())
  );
  const userMap: Record<string, Record<string, unknown>> = {};
  userDocs.forEach((d) => { if (d.exists) userMap[d.id] = d.data()!; });

  const members = membersSnap.docs.map((d) => {
    const m = d.data();
    const u = userMap[m.userId] || {};
    return {
      memberId: d.id,
      userId: m.userId,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
      fullName: u.fullName || "",
      email: u.email || "",
      phoneNumber: u.phoneNumber || "",
    };
  });

  return NextResponse.json({ members });
}

// POST — join environment via invite code
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.globalStatus === "blocked") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getAdminDb();

  // Check not already a member
  const existing = await db
    .collection(COLLECTIONS.environmentMembers)
    .where("environmentId", "==", id)
    .where("userId", "==", session.userId)
    .limit(1)
    .get();

  if (!existing.empty) {
    const data = existing.docs[0].data();
    return NextResponse.json({ alreadyMember: true, status: data.status, memberId: existing.docs[0].id });
  }

  const envDoc = await db.collection(COLLECTIONS.environments).doc(id).get();
  const requireApproval = envDoc.exists ? envDoc.data()?.requireApproval !== false : true;
  const memberStatus = requireApproval ? "pending" : "approved";

  const now = FieldValue.serverTimestamp();
  const memberRef = await db.collection(COLLECTIONS.environmentMembers).add({
    environmentId: id,
    userId: session.userId,
    role: "user",
    status: memberStatus,
    joinedAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ memberId: memberRef.id, status: memberStatus }, { status: 201 });
}
