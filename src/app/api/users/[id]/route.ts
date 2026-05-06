import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminDb, getAdminAuth, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  if (body.role !== undefined && !["admin", "user"].includes(body.role)) {
    return NextResponse.json({ error: "ערך role לא תקין" }, { status: 400 });
  }
  if (body.status !== undefined && !["pending", "approved"].includes(body.status)) {
    return NextResponse.json({ error: "ערך status לא תקין" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  const allowed = ["fullName", "branch", "department", "role", "status", "phoneNumber"] as const;
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  const db = getAdminDb();
  await db.collection(COLLECTIONS.users).doc(id).update(update);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  const db = getAdminDb();
  const auth = getAdminAuth();

  await db.collection(COLLECTIONS.users).doc(id).delete();

  try {
    await auth.deleteUser(id);
  } catch {
    // Auth user may not exist — that's fine
  }

  return NextResponse.json({ ok: true });
}
