import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || !isEnvAdmin(session)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const db = getAdminDb();

  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (body.status === "blocked" || body.status === "active") update.status = body.status;
  if (typeof body.quantity === "number" && body.quantity > 0) update.quantity = body.quantity;

  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: "אין שדות לעדכן" }, { status: 400 });
  }

  await db.collection(COLLECTIONS.orderItems).doc(id).update(update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || !isEnvAdmin(session)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { id } = await params;
  const db = getAdminDb();
  await db.collection(COLLECTIONS.orderItems).doc(id).delete();
  return NextResponse.json({ ok: true });
}
