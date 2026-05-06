import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  const db = getAdminDb();
  const doc = await db.collection(COLLECTIONS.users).doc(session.userId).get();
  if (!doc.exists) return NextResponse.json({ user: null });

  const data = doc.data()!;
  return NextResponse.json({
    user: {
      id: doc.id,
      email: data.email,
      fullName: data.fullName,
      branch: data.branch,
      department: data.department,
      role: data.role,
      status: data.status,
    },
  });
}
