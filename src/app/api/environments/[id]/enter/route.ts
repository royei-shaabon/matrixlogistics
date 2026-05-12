import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession, setSessionCookie } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";

// POST /api/environments/[id]/enter — set current environment in session
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.globalStatus === "blocked") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getAdminDb();

  const envDoc = await db.collection(COLLECTIONS.environments).doc(id).get();
  const envStatus = envDoc.data()?.status;
  if (!envDoc.exists || envStatus === "blocked") {
    return NextResponse.json({ error: "סביבה לא נמצאה או חסומה" }, { status: 404 });
  }

  let memberRole: "user" | "environment_admin" = "user";
  let memberStatus: "pending" | "approved" | "blocked" = "pending";

  if (session.globalRole === "super_admin") {
    memberRole = "environment_admin";
    memberStatus = "approved";
  } else {
    const memberSnap = await db
      .collection(COLLECTIONS.environmentMembers)
      .where("environmentId", "==", id)
      .where("userId", "==", session.userId)
      .limit(1)
      .get();

    if (memberSnap.empty) {
      // Auto-join: create membership respecting requireApproval setting
      const requireApproval = envDoc.data()?.requireApproval !== false;
      const autoStatus = requireApproval ? "pending" : "approved";
      const { FieldValue } = await import("firebase-admin/firestore");
      const now = FieldValue.serverTimestamp();
      await db.collection(COLLECTIONS.environmentMembers).add({
        environmentId: id,
        userId: session.userId,
        role: "user",
        status: autoStatus,
        joinedAt: now,
        updatedAt: now,
      });
      memberRole = "user";
      memberStatus = autoStatus;
    } else {
      const member = memberSnap.docs[0].data();
      if (member.status === "blocked") {
        return NextResponse.json({ error: "גישתך לסביבה זו חסומה" }, { status: 403 });
      }
      memberRole = member.role as "user" | "environment_admin";
      memberStatus = member.status as "pending" | "approved" | "blocked";
    }
  }

  // Only environment_admin (owner) may enter a pending environment; regular users must wait for approval
  if (envStatus === "pending" && session.globalRole !== "super_admin" && memberRole !== "environment_admin") {
    return NextResponse.json({ error: "הסביבה ממתינה לאישור מנהל ראשי" }, { status: 403 });
  }

  const newSession = await createSession({
    ...session,
    currentEnvironmentId: id,
    environmentRole: memberRole,
    environmentStatus: memberStatus,
  });

  const redirect =
    memberStatus === "pending"
      ? "/pending"
      : memberRole === "environment_admin"
      ? "/admin"
      : "/order";

  const res = NextResponse.json({ ok: true, redirect });
  return setSessionCookie(res, newSession);
}
