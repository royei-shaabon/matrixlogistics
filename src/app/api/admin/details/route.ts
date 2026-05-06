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

  if (explicitWindowId) {
    windowId = explicitWindowId;
  } else {
    const windowDoc = await db.collection(COLLECTIONS.orderWindow).doc("current").get();
    if (!windowDoc.exists) return NextResponse.json({ details: [] });
    windowId = windowDoc.data()!.windowId;
  }

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
    itemDocId: string;
    userId: string;
    userFullName: string;
    email: string;
    branch: string;
    department: string;
    itemName: string;
    quantity: number;
    orderNote: string;
    status: string;
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
        itemDocId: itemDoc.id,
        userId: order.userId,
        userFullName: order.userFullName,
        email: order.email,
        branch: order.branch,
        department: order.department,
        itemName: item.itemName,
        quantity: item.quantity,
        orderNote: item.orderNote || "",
        status: item.status || "active",
      });
    }
  }

  allItems.sort((a, b) => a.userFullName.localeCompare(b.userFullName, "he"));
  return NextResponse.json({ details: allItems });
}
