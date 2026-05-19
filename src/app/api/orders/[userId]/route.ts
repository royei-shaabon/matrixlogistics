import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session || !isEnvAdmin(session) || !session.currentEnvironmentId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { userId } = await params;
  const sectionId = new URL(req.url).searchParams.get("sectionId");
  if (!sectionId) return NextResponse.json({ error: "sectionId נדרש" }, { status: 400 });

  const db = getAdminDb();

  // Verify section belongs to admin's environment
  const sectionDoc = await db.collection(COLLECTIONS.sections).doc(sectionId).get();
  if (!sectionDoc.exists || sectionDoc.data()?.environmentId !== session.currentEnvironmentId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const ordersSnap = await db
    .collection(COLLECTIONS.orders)
    .where("userId", "==", userId)
    .where("sectionId", "==", sectionId)
    .where("environmentId", "==", session.currentEnvironmentId)
    .limit(1)
    .get();

  if (ordersSnap.empty) {
    return NextResponse.json({ error: "לא נמצאה הזמנה" }, { status: 404 });
  }

  const orderId = ordersSnap.docs[0].id;
  const itemsSnap = await db.collection(COLLECTIONS.orderItems).where("orderId", "==", orderId).get();

  const batch = db.batch();
  itemsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(ordersSnap.docs[0].ref);
  await batch.commit();

  return NextResponse.json({ ok: true });
}
