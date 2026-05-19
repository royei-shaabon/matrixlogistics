import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

type Params = { params: Promise<{ id: string; memberId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, memberId } = await params;
  if (session.globalRole !== "super_admin" && session.currentEnvironmentId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isEnvAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

  const ALLOWED_STATUS = ["pending", "approved", "blocked"];
  const ALLOWED_ROLE = ["user", "environment_admin"];
  if (body.status && ALLOWED_STATUS.includes(body.status)) update.status = body.status;
  if (body.role && ALLOWED_ROLE.includes(body.role)) update.role = body.role;

  const db = getAdminDb();
  const memberDoc = await db.collection(COLLECTIONS.environmentMembers).doc(memberId).get();
  if (!memberDoc.exists) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  if (session.globalRole !== "super_admin" && memberDoc.data()!.environmentId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.collection(COLLECTIONS.environmentMembers).doc(memberId).update(update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, memberId } = await params;
  if (session.globalRole !== "super_admin" && session.currentEnvironmentId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isEnvAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getAdminDb();
  const memberDoc = await db.collection(COLLECTIONS.environmentMembers).doc(memberId).get();
  if (!memberDoc.exists) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  if (session.globalRole !== "super_admin" && memberDoc.data()!.environmentId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.collection(COLLECTIONS.environmentMembers).doc(memberId).delete();
  return NextResponse.json({ ok: true });
}
