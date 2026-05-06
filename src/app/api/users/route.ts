import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const db = getAdminDb();
  const snapshot = await db
    .collection(COLLECTIONS.users)
    .where("role", "==", "user")
    .get();

  const users = snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || null,
    }))
    .sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt > a.createdAt ? 1 : -1;
    });

  return NextResponse.json({ users });
}
