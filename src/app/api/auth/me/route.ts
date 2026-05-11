import { NextResponse } from "next/server";
import { getSession, createSession, setSessionCookie } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  const db = getAdminDb();
  const doc = await db.collection(COLLECTIONS.users).doc(session.userId).get();
  if (!doc.exists) return NextResponse.json({ user: null });

  const data = doc.data()!;
  const globalRole = data.globalRole || "user";
  const globalStatus = data.globalStatus || "active";

  let environmentRole = session.environmentRole;
  let environmentStatus = session.environmentStatus;

  // Refresh environment membership if in an environment
  if (session.currentEnvironmentId && session.globalRole !== "super_admin") {
    const memberSnap = await db
      .collection(COLLECTIONS.environmentMembers)
      .where("environmentId", "==", session.currentEnvironmentId)
      .where("userId", "==", session.userId)
      .limit(1)
      .get();
    if (!memberSnap.empty) {
      const m = memberSnap.docs[0].data();
      environmentRole = m.role;
      environmentStatus = m.status;
    }
  }

  const needsRefresh =
    globalRole !== session.globalRole ||
    globalStatus !== session.globalStatus ||
    environmentRole !== session.environmentRole ||
    environmentStatus !== session.environmentStatus;

  const res = NextResponse.json({
    user: {
      id: doc.id,
      email: data.email,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber || "",
      globalRole,
      globalStatus,
      currentEnvironmentId: session.currentEnvironmentId,
      environmentRole,
      environmentStatus,
    },
  });

  if (needsRefresh) {
    const newToken = await createSession({
      ...session,
      globalRole,
      globalStatus,
      environmentRole,
      environmentStatus,
    });
    return setSessionCookie(res, newToken);
  }

  return res;
}
