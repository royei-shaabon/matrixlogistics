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
  if (!windowDoc.exists) return NextResponse.json({ details: [] });

  const windowId = windowDoc.data()!.windowId;

  const ordersSnap = await db
    .collection(COLLECTIONS.orders)
    .where("windowId", "==", windowId)
    .get();

  if (ordersSnap.empty) return NextResponse.json({ details: [] });

  const orderMap = new Map(
    ordersSnap.docs.map((d) => [d.id, d.data() as { userId: string; userFullName: string; email: string; branch: string; department: string }])
  );
  const orderIds = ordersSnap.docs.map((d) => d.id);

  const allItems: {
    userId: string;
    userFullName: string;
    email: string;
    branch: string;
    department: string;
    itemName: string;
    quantity: number;
    orderNote: string;
  }[] = [];

  for (let i = 0; i < orderIds.length; i += 30) {
    const chunk = orderIds.slice(i, i + 30);
    const itemsSnap = await db
      .collection(COLLECTIONS.orderItems)
      .where("orderId", "in", chunk)
      .get();

    for (const itemDoc of itemsSnap.docs) {
      const item = itemDoc.data();
      const order = orderMap.get(item.orderId)!;
      allItems.push({
        userId: order.userId,
        userFullName: order.userFullName,
        email: order.email,
        branch: order.branch,
        department: order.department,
        itemName: item.itemName,
        quantity: item.quantity,
        orderNote: item.orderNote || "",
      });
    }
  }

  allItems.sort((a, b) => a.userFullName.localeCompare(b.userFullName, "he"));

  return NextResponse.json({ details: allItems });
}
