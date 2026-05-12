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
  const SUPER_ADMIN_EMAIL = "shaabon.royei@gmail.com";

  const doc = await db.collection(COLLECTIONS.users).doc(uid).get();

  if (!doc.exists) {
    // Check by email
    const byEmail = await db.collection(COLLECTIONS.users).where("email", "==", email).limit(1).get();
    if (!byEmail.empty) {
      const existing = byEmail.docs[0];
      const data = existing.data();
      if (data.globalStatus === "blocked") {
        return NextResponse.json({ error: "חשבונך חסום" }, { status: 403 });
      }
      const effectiveRole = email === SUPER_ADMIN_EMAIL ? "super_admin" : (data.globalRole || "user");
      const sessionToken = await createSession({
        userId: existing.id,
        email,
        globalRole: effectiveRole,
        globalStatus: data.globalStatus || "active",
      });
      const res = NextResponse.json({ ok: true, globalRole: effectiveRole });
      return setSessionCookie(res, sessionToken);
    }
    return NextResponse.json({ needsRegistration: true });
  }

  const data = doc.data()!;
  if (data.globalStatus === "blocked") {
    return NextResponse.json({ error: "חשבונך חסום" }, { status: 403 });
  }

  const effectiveRole = email === SUPER_ADMIN_EMAIL ? "super_admin" : (data.globalRole || "user");
  const sessionToken = await createSession({
    userId: uid,
    email,
    globalRole: effectiveRole,
    globalStatus: data.globalStatus || "active",
  });

  const res = NextResponse.json({ ok: true, globalRole: effectiveRole });
  return setSessionCookie(res, sessionToken);
}
