import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { createSession, setSessionCookie } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  const { token, name, branch, department } = await req.json();

  if (!token || !name || !branch || !department) {
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

  // Check if user doc already exists
  const existing = await db.collection(COLLECTIONS.users).doc(uid).get();
  if (existing.exists) {
    const data = existing.data()!;
    const sessionToken = await createSession({
      userId: uid,
      email,
      role: data.role,
      status: data.status,
    });
    const res = NextResponse.json({ ok: true, status: data.status, role: data.role });
    return setSessionCookie(res, sessionToken);
  }

  // Create new user doc
  await db.collection(COLLECTIONS.users).doc(uid).set({
    email,
    fullName: name,
    branch,
    department,
    role: "user",
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const sessionToken = await createSession({
    userId: uid,
    email,
    role: "user",
    status: "pending",
  });

  const res = NextResponse.json({ ok: true, status: "pending" });
  return setSessionCookie(res, sessionToken);
}
