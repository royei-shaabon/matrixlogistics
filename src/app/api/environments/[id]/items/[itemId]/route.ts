import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, itemId } = await params;
  if (session.globalRole !== "super_admin" && session.currentEnvironmentId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isEnvAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (body.name !== undefined) update.name = body.name.trim();
  if (body.unit !== undefined) update.unit = body.unit.trim();
  if (body.category !== undefined) update.category = body.category.trim();
  if (body.isActive !== undefined) update.isActive = body.isActive;
  if (body.sortOrder !== undefined) update.sortOrder = body.sortOrder;

  const db = getAdminDb();
  await db.collection(COLLECTIONS.items).doc(itemId).update(update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, itemId } = await params;
  if (session.globalRole !== "super_admin" && session.currentEnvironmentId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isEnvAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getAdminDb();
  await db.collection(COLLECTIONS.items).doc(itemId).delete();
  return NextResponse.json({ ok: true });
}
