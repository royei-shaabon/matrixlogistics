import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

const SUPER_ADMIN_EMAIL = "shaabon.royei@gmail.com";
const ENV_NAME = "Get Supply Main";
const SECRET = process.env.MIGRATE_SECRET || "migrate-secret-2025";

export async function POST(req: NextRequest) {
  const { secret } = await req.json().catch(() => ({}));
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const auth = getAdminAuth();
  const results: string[] = [];

  // 1. Find super admin user by email
  let superAdminUid: string | null = null;
  try {
    const authUser = await auth.getUserByEmail(SUPER_ADMIN_EMAIL);
    superAdminUid = authUser.uid;
    results.push(`Found super admin: ${superAdminUid}`);
  } catch {
    results.push(`WARNING: Could not find Firebase Auth user for ${SUPER_ADMIN_EMAIL}`);
  }

  // 2. Update user doc to super_admin
  if (superAdminUid) {
    const userRef = db.collection(COLLECTIONS.users).doc(superAdminUid);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      await userRef.update({ globalRole: "super_admin", globalStatus: "active", updatedAt: FieldValue.serverTimestamp() });
      results.push(`Updated ${SUPER_ADMIN_EMAIL} to super_admin`);
    } else {
      await userRef.set({
        email: SUPER_ADMIN_EMAIL,
        fullName: "Royei Shaabon",
        phoneNumber: "",
        globalRole: "super_admin",
        globalStatus: "active",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      results.push(`Created user doc for ${SUPER_ADMIN_EMAIL} as super_admin`);
    }
  }

  // 3. Check if main environment already exists
  const envSnap = await db.collection(COLLECTIONS.environments).where("name", "==", ENV_NAME).limit(1).get();
  let mainEnvId: string;

  if (!envSnap.empty) {
    mainEnvId = envSnap.docs[0].id;
    results.push(`Main environment already exists: ${mainEnvId}`);
  } else {
    const inviteCode = randomUUID().replace(/-/g, "").substring(0, 12).toUpperCase();
    const envRef = await db.collection(COLLECTIONS.environments).add({
      name: ENV_NAME,
      description: "הסביבה הראשית של Get Supply",
      ownerUserId: superAdminUid || "system",
      status: "active",
      inviteCode,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    mainEnvId = envRef.id;
    results.push(`Created main environment: ${mainEnvId} with invite code ${inviteCode}`);
  }

  // 4. Migrate existing users — add them as members of main environment if not already
  const allUsersSnap = await db.collection(COLLECTIONS.users).get();
  let migrated = 0;
  for (const userDoc of allUsersSnap.docs) {
    const uid = userDoc.id;
    const userData = userDoc.data();

    // Skip super admin (they auto-get admin access)
    if (uid === superAdminUid) continue;

    // Check if already a member
    const existingMember = await db.collection(COLLECTIONS.environmentMembers)
      .where("environmentId", "==", mainEnvId)
      .where("userId", "==", uid)
      .limit(1)
      .get();

    if (!existingMember.empty) continue;

    // Old status mapping
    const oldStatus = userData.status || "pending";
    const oldRole = userData.role || "user";
    const memberStatus = oldStatus === "approved" ? "approved" : "pending";
    const memberRole = oldRole === "admin" ? "environment_admin" : "user";

    // Update globalRole/globalStatus on user doc if not set
    const updates: Record<string, unknown> = {};
    if (!userData.globalRole) updates.globalRole = "user";
    if (!userData.globalStatus) updates.globalStatus = oldStatus === "blocked" ? "blocked" : "active";
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = FieldValue.serverTimestamp();
      await userDoc.ref.update(updates);
    }

    await db.collection(COLLECTIONS.environmentMembers).add({
      environmentId: mainEnvId,
      userId: uid,
      role: memberRole,
      status: memberStatus,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    migrated++;
  }
  results.push(`Migrated ${migrated} users as environment members`);

  return NextResponse.json({ ok: true, results });
}
