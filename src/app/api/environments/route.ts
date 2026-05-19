import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

// GET /api/environments — list environments the user belongs to
export async function GET() {
  const session = await getSession();
  if (!session || session.globalStatus === "blocked") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();

  if (session.globalRole === "super_admin") {
    const snap = await db.collection(COLLECTIONS.environments).orderBy("createdAt", "desc").limit(200).get();
    const envDocs = snap.docs;

    // Fetch owner user names, member counts, order counts in parallel per env
    const enriched = await Promise.all(
      envDocs.map(async (d) => {
        const data = d.data();
        const envId = d.id;

        const [ownerDoc, membersSnap, ordersSnap] = await Promise.all([
          data.ownerUserId
            ? db.collection(COLLECTIONS.users).doc(data.ownerUserId).get()
            : Promise.resolve(null),
          db.collection(COLLECTIONS.environmentMembers)
            .where("environmentId", "==", envId)
            .where("status", "==", "approved")
            .count()
            .get(),
          db.collection(COLLECTIONS.orders)
            .where("environmentId", "==", envId)
            .count()
            .get(),
        ]);

        const ownerData = ownerDoc?.exists ? ownerDoc.data() : null;
        return {
          id: envId,
          ...data,
          ownerName: ownerData?.fullName || ownerData?.email || null,
          ownerEmail: ownerData?.email || null,
          memberCount: membersSnap.data().count,
          orderCount: ordersSnap.data().count,
        };
      })
    );

    return NextResponse.json({ environments: enriched });
  }

  const memberships = await db
    .collection(COLLECTIONS.environmentMembers)
    .where("userId", "==", session.userId)
    .get();

  if (memberships.empty) return NextResponse.json({ environments: [] });

  const envIds = memberships.docs.map((d) => d.data().environmentId as string);
  const envDocs = await Promise.all(
    envIds.map((id) => db.collection(COLLECTIONS.environments).doc(id).get())
  );

  const memberMap: Record<string, { role: string; status: string; memberId: string }> = {};
  memberships.docs.forEach((d) => {
    const data = d.data();
    memberMap[data.environmentId] = { role: data.role, status: data.status, memberId: d.id };
  });

  return NextResponse.json({
    environments: envDocs
      .filter((d) => d.exists)
      .map((d) => ({
        id: d.id,
        ...d.data(),
        memberRole: memberMap[d.id]?.role,
        memberStatus: memberMap[d.id]?.status,
        memberId: memberMap[d.id]?.memberId,
      })),
  });
}

// POST /api/environments — create new environment
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.globalStatus === "blocked") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "שם סביבה נדרש" }, { status: 400 });

  const db = getAdminDb();
  const inviteCode = randomUUID();
  const now = FieldValue.serverTimestamp();

  const isSuperAdmin = session.globalRole === "super_admin";
  const envRef = await db.collection(COLLECTIONS.environments).add({
    name: name.trim(),
    description: description?.trim() || "",
    ownerUserId: session.userId,
    status: isSuperAdmin ? "active" : "pending",
    inviteCode,
    createdAt: now,
    updatedAt: now,
  });

  // Add creator as environment_admin
  await db.collection(COLLECTIONS.environmentMembers).add({
    environmentId: envRef.id,
    userId: session.userId,
    role: "environment_admin",
    status: "approved",
    joinedAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id: envRef.id, inviteCode }, { status: 201 });
}
