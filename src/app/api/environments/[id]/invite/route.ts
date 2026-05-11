import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { randomUUID } from "crypto";
import { FieldValue } from "firebase-admin/firestore";

// GET /api/environments/[id]/invite — get invite link
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (session.globalRole !== "super_admin" && session.currentEnvironmentId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isEnvAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getAdminDb();
  const doc = await db.collection(COLLECTIONS.environments).doc(id).get();
  if (!doc.exists) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  return NextResponse.json({ inviteCode: doc.data()?.inviteCode });
}

// POST /api/environments/[id]/invite — regenerate invite code
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (session.globalRole !== "super_admin" && session.currentEnvironmentId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isEnvAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const newCode = randomUUID();
  const db = getAdminDb();
  await db.collection(COLLECTIONS.environments).doc(id).update({
    inviteCode: newCode,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ inviteCode: newCode });
}
