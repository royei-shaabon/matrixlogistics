import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token חסר" }, { status: 400 });

  const adminAuth = getAdminAuth();
  const db = getAdminDb();

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Token לא תקין" }, { status: 401 });
  }

  const uid = decoded.uid;
  const email = decoded.email || "";

  const doc = await db.collection(COLLECTIONS.users).doc(uid).get();

  // If no doc for this Google UID, check if the same email registered with email/password
  if (!doc.exists) {
    const byEmail = await db.collection(COLLECTIONS.users).where("email", "==", email).limit(1).get();
    if (!byEmail.empty) {
      const existing = byEmail.docs[0];
      const data = existing.data();
      const sessionToken = await createSession({
        userId: existing.id,
        email,
        role: data.role,
        status: data.status,
      });
      const res = NextResponse.json({ ok: true, status: data.status, role: data.role });
      return setSessionCookie(res, sessionToken);
    }
    return NextResponse.json({ needsRegistration: true });
  }

  const data = doc.data()!;
  const sessionToken = await createSession({
    userId: uid,
    email,
    role: data.role,
    status: data.status,
  });

  const res = NextResponse.json({ ok: true, status: data.status, role: data.role });
  return setSessionCookie(res, sessionToken);
}
