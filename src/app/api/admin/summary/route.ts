import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const db = getAdminDb();

  const windowDoc = await db.collection(COLLECTIONS.orderWindow).doc("current").get();
  if (!windowDoc.exists) return NextResponse.json({ summary: [], window: null });

  const window = { ...windowDoc.data(), updatedAt: windowDoc.data()?.updatedAt?.toDate().toISOString() };
  const windowId = windowDoc.data()!.windowId;

  // Get all orders for this window
  const ordersSnap = await db
    .collection(COLLECTIONS.orders)
    .where("windowId", "==", windowId)
    .get();

  if (ordersSnap.empty) return NextResponse.json({ summary: [], window });

  const orderIds = ordersSnap.docs.map((d) => d.id);

  // Firestore 'in' query supports up to 30 items
  const allItems: { itemId: number; itemName: string; quantity: number; orderNote: string }[] = [];
  for (let i = 0; i < orderIds.length; i += 30) {
    const chunk = orderIds.slice(i, i + 30);
    const itemsSnap = await db
      .collection(COLLECTIONS.orderItems)
      .where("orderId", "in", chunk)
      .get();
    itemsSnap.docs.forEach((d) => allItems.push(d.data() as typeof allItems[0]));
  }

  // Aggregate by itemId
  const map = new Map<number, { itemName: string; total: number; notes: string[] }>();
  for (const item of allItems) {
    const existing = map.get(item.itemId);
    if (existing) {
      existing.total += item.quantity;
      if (item.orderNote) existing.notes.push(item.orderNote);
    } else {
      map.set(item.itemId, {
        itemName: item.itemName,
        total: item.quantity,
        notes: item.orderNote ? [item.orderNote] : [],
      });
    }
  }

  const summary = Array.from(map.entries())
    .map(([itemId, v]) => ({
      itemId,
      itemName: v.itemName,
      total: v.total,
      notes: [...new Set(v.notes)].join("; "),
    }))
    .sort((a, b) => a.itemId - b.itemId);

  return NextResponse.json({ summary, window });
}
