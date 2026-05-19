import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// GET — list items for environment (active only for users, all for admins)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (session.globalRole !== "super_admin" && session.currentEnvironmentId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getAdminDb();
  const isAdmin = isEnvAdmin(session);

  const snap = await db.collection(COLLECTIONS.items).where("environmentId", "==", id).get();

  const items = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((item: Record<string, unknown>) => isAdmin || item.isActive !== false)
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      ((a.sortOrder as number) ?? 0) - ((b.sortOrder as number) ?? 0)
    );
  return NextResponse.json({ items });
}

// POST — add item to environment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (session.globalRole !== "super_admin" && session.currentEnvironmentId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isEnvAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, unit, category, sortOrder } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "שם פריט נדרש" }, { status: 400 });

  const db = getAdminDb();
  const now = FieldValue.serverTimestamp();

  // Get max sortOrder if not provided
  let order = sortOrder;
  if (order === undefined) {
    const existing = await db.collection(COLLECTIONS.items).where("environmentId", "==", id).get();
    order = existing.empty
      ? 0
      : Math.max(...existing.docs.map((d) => (d.data().sortOrder as number) ?? 0)) + 1;
  }

  const ref = await db.collection(COLLECTIONS.items).add({
    environmentId: id,
    name: name.trim(),
    unit: unit?.trim() || "",
    category: category?.trim() || "כללי",
    isActive: true,
    sortOrder: order,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id: ref.id }, { status: 201 });
}
