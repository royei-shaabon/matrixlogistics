import { NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";

// GET — list members of current environment (env admins see their env, super_admin sees all)
export async function GET() {
  const session = await getSession();
  if (!session || !isEnvAdmin(session)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const db = getAdminDb();

  if (session.globalRole === "super_admin" && !session.currentEnvironmentId) {
    // Super admin global view — all users
    const snapshot = await db.collection(COLLECTIONS.users).orderBy("createdAt", "desc").get();
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || null,
    }));
    return NextResponse.json({ users });
  }

  if (!session.currentEnvironmentId) {
    return NextResponse.json({ error: "לא מחובר לסביבה" }, { status: 403 });
  }

  // List members of this environment
  const membersSnap = await db
    .collection(COLLECTIONS.environmentMembers)
    .where("environmentId", "==", session.currentEnvironmentId)
    .get();

  if (membersSnap.empty) return NextResponse.json({ users: [] });

  const userIds = [...new Set(membersSnap.docs.map((d) => d.data().userId as string))];
  const userDocs = await Promise.all(userIds.map((id) => db.collection(COLLECTIONS.users).doc(id).get()));
  const userMap: Record<string, Record<string, unknown>> = {};
  userDocs.forEach((d) => { if (d.exists) userMap[d.id] = d.data()!; });

  const memberMap: Record<string, { role: string; status: string; memberId: string }> = {};
  membersSnap.docs.forEach((d) => {
    const data = d.data();
    memberMap[data.userId] = { role: data.role, status: data.status, memberId: d.id };
  });

  const users = userIds.map((uid) => {
    const u = userMap[uid] || {};
    const m = memberMap[uid];
    return {
      id: uid,
      fullName: u.fullName || "",
      email: u.email || "",
      phoneNumber: u.phoneNumber || "",
      globalStatus: u.globalStatus || "active",
      memberRole: m?.role,
      memberStatus: m?.status,
      memberId: m?.memberId,
      createdAt: (u.createdAt as FirebaseFirestore.Timestamp)?.toDate().toISOString() || null,
    };
  });

  return NextResponse.json({ users });
}
