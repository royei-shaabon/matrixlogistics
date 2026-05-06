import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  const db = getAdminDb();

  await db.collection(COLLECTIONS.users).doc(id).update({
    status: "approved",
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
