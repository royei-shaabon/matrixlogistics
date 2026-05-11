import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !isEnvAdmin(session) || !session.currentEnvironmentId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const envId = session.currentEnvironmentId;
  const db = getAdminDb();
  const sectionId = new URL(req.url).searchParams.get("sectionId");

  let resolvedSectionId: string;
  if (sectionId) {
    resolvedSectionId = sectionId;
  } else {
    const activeSnap = await db
      .collection(COLLECTIONS.sections)
      .where("environmentId", "==", envId)
      .where("status", "==", "active")
      .limit(1)
      .get();
    if (activeSnap.empty) return NextResponse.json({ details: [] });
    resolvedSectionId = activeSnap.docs[0].id;
  }

  const ordersSnap = await db
    .collection(COLLECTIONS.orders)
    .where("sectionId", "==", resolvedSectionId)
    .where("environmentId", "==", envId)
    .get();

  if (ordersSnap.empty) return NextResponse.json({ details: [] });

  const orderMap = new Map(
    ordersSnap.docs.map((d) => [d.id, d.data() as { userId: string; userFullName: string; email: string; phoneNumber: string }])
  );
  const orderIds = ordersSnap.docs.map((d) => d.id);

  const allItems: {
    itemDocId: string;
    userId: string;
    userFullName: string;
    email: string;
    phoneNumber: string;
    itemName: string;
    quantity: number;
    note: string;
    status: string;
  }[] = [];

  for (let i = 0; i < orderIds.length; i += 30) {
    const chunk = orderIds.slice(i, i + 30);
    const itemsSnap = await db.collection(COLLECTIONS.orderItems).where("orderId", "in", chunk).get();
    for (const itemDoc of itemsSnap.docs) {
      const item = itemDoc.data();
      const order = orderMap.get(item.orderId)!;
      allItems.push({
        itemDocId: itemDoc.id,
        userId: order?.userId || "",
        userFullName: order?.userFullName || "",
        email: order?.email || "",
        phoneNumber: order?.phoneNumber || "",
        itemName: item.itemNameSnapshot,
        quantity: item.quantity,
        note: item.note || "",
        status: item.status || "active",
      });
    }
  }

  allItems.sort((a, b) => a.userFullName.localeCompare(b.userFullName, "he"));
  return NextResponse.json({ details: allItems });
}
