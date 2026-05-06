import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const db = getAdminDb();
  const explicitWindowId = new URL(req.url).searchParams.get("windowId");

  let windowId: string;
  let windowMeta: Record<string, unknown> = {};

  if (explicitWindowId) {
    windowId = explicitWindowId;
  } else {
    const windowDoc = await db.collection(COLLECTIONS.orderWindow).doc("current").get();
    if (!windowDoc.exists) return NextResponse.json({ summary: [], window: null });
    const data = windowDoc.data()!;
    windowId = data.windowId;
    windowMeta = { ...data, updatedAt: data.updatedAt?.toDate().toISOString() };
  }

  const ordersSnap = await db
    .collection(COLLECTIONS.orders)
    .where("windowId", "==", windowId)
    .get();

  if (ordersSnap.empty) return NextResponse.json({ summary: [], window: windowMeta });

  const orderIds = ordersSnap.docs.map((d) => d.id);

  const allItems: { itemId: number; itemName: string; quantity: number; orderNote: string; status?: string }[] = [];
  for (let i = 0; i < orderIds.length; i += 30) {
    const chunk = orderIds.slice(i, i + 30);
    const itemsSnap = await db
      .collection(COLLECTIONS.orderItems)
      .where("orderId", "in", chunk)
      .get();
    itemsSnap.docs.forEach((d) => allItems.push(d.data() as typeof allItems[0]));
  }

  const activeItems = allItems.filter((item) => item.status !== "blocked");

  const map = new Map<number, { itemName: string; total: number; notes: string[] }>();
  for (const item of activeItems) {
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

  return NextResponse.json({ summary, window: windowMeta });
}
