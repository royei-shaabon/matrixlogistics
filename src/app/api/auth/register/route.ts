import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { createSession, setSessionCookie } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  const { token, name, phone } = await req.json();

  if (!token || !name || !phone) {
    return NextResponse.json({ error: "כל השדות נדרשים" }, { status: 400 });
  }

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

  const existing = await db.collection(COLLECTIONS.users).doc(uid).get();
  if (existing.exists) {
    const data = existing.data()!;
    const sessionToken = await createSession({
      userId: uid,
      email,
      globalRole: data.globalRole || "user",
      globalStatus: data.globalStatus || "active",
    });
    const res = NextResponse.json({ ok: true, globalRole: data.globalRole || "user" });
    return setSessionCookie(res, sessionToken);
  }

  await db.collection(COLLECTIONS.users).doc(uid).set({
    email,
    fullName: name.trim(),
    phoneNumber: phone.trim(),
    globalRole: "user",
    globalStatus: "active",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const sessionToken = await createSession({
    userId: uid,
    email,
    globalRole: "user",
    globalStatus: "active",
  });

  const res = NextResponse.json({ ok: true, globalRole: "user" });
  return setSessionCookie(res, sessionToken);
}
