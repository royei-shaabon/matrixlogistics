import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Token נדרש" }, { status: 400 });
  }

  const adminAuth = getAdminAuth();
  const db = getAdminDb();

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "מייל או סיסמה שגויים" }, { status: 401 });
  }

  const uid = decoded.uid;

  const userDoc = await db.collection(COLLECTIONS.users).doc(uid).get();
  if (!userDoc.exists) {
    return NextResponse.json({ error: "משתמש לא נמצא במערכת" }, { status: 404 });
  }

  const user = userDoc.data()!;

  const sessionToken = await createSession({
    userId: uid,
    email: user.email,
    role: user.role,
    status: user.status,
  });

  const res = NextResponse.json({ ok: true, role: user.role, status: user.status });
  return setSessionCookie(res, sessionToken);
}
