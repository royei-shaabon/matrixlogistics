import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session || !isEnvAdmin(session)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const { userId } = await params;
  const db = getAdminDb();

  // Get current window
  const windowDoc = await db.collection(COLLECTIONS.orderWindow).doc("current").get();
  if (!windowDoc.exists) return NextResponse.json({ error: "אין חלון הזמנה" }, { status: 400 });
  const windowId = windowDoc.data()!.windowId;

  // Find the user's order for this window
  const ordersSnap = await db
    .collection(COLLECTIONS.orders)
    .where("userId", "==", userId)
    .where("windowId", "==", windowId)
    .get();

  if (ordersSnap.empty) {
    return NextResponse.json({ error: "לא נמצאה הזמנה" }, { status: 404 });
  }

  const orderId = ordersSnap.docs[0].id;

  // Delete all order items
  const itemsSnap = await db
    .collection(COLLECTIONS.orderItems)
    .where("orderId", "==", orderId)
    .get();

  await Promise.all([
    ...itemsSnap.docs.map((d) => d.ref.delete()),
    ordersSnap.docs[0].ref.delete(),
  ]);

  return NextResponse.json({ ok: true });
}
