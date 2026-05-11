import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token נדרש" }, { status: 400 });

  const adminAuth = getAdminAuth();
  const db = getAdminDb();

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "מייל או סיסמה שגויים" }, { status: 401 });
  }

  const userDoc = await db.collection(COLLECTIONS.users).doc(decoded.uid).get();
  if (!userDoc.exists) {
    return NextResponse.json({ error: "משתמש לא נמצא במערכת" }, { status: 404 });
  }

  const user = userDoc.data()!;
  if (user.globalStatus === "blocked") {
    return NextResponse.json({ error: "חשבונך חסום" }, { status: 403 });
  }

  const sessionToken = await createSession({
    userId: decoded.uid,
    email: user.email,
    globalRole: user.globalRole || "user",
    globalStatus: user.globalStatus || "active",
  });

  const res = NextResponse.json({ ok: true, globalRole: user.globalRole || "user" });
  return setSessionCookie(res, sessionToken);
}
