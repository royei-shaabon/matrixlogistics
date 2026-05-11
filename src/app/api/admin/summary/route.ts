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
    if (activeSnap.empty) return NextResponse.json({ summary: [], section: null });
    resolvedSectionId = activeSnap.docs[0].id;
  }

  const ordersSnap = await db
    .collection(COLLECTIONS.orders)
    .where("sectionId", "==", resolvedSectionId)
    .where("environmentId", "==", envId)
    .get();

  if (ordersSnap.empty) return NextResponse.json({ summary: [], section: { id: resolvedSectionId } });

  const orderIds = ordersSnap.docs.map((d) => d.id);
  const allItems: { itemId: string; itemName: string; quantity: number; note: string; status: string }[] = [];

  for (let i = 0; i < orderIds.length; i += 30) {
    const chunk = orderIds.slice(i, i + 30);
    const itemsSnap = await db.collection(COLLECTIONS.orderItems).where("orderId", "in", chunk).get();
    itemsSnap.docs.forEach((d) => {
      const data = d.data();
      allItems.push({
        itemId: data.itemId,
        itemName: data.itemNameSnapshot,
        quantity: data.quantity,
        note: data.note || "",
        status: data.status || "active",
      });
    });
  }

  const active = allItems.filter((i) => i.status !== "blocked");
  const map = new Map<string, { itemName: string; total: number; notes: string[] }>();
  for (const item of active) {
    const ex = map.get(item.itemId);
    if (ex) {
      ex.total += item.quantity;
      if (item.note) ex.notes.push(item.note);
    } else {
      map.set(item.itemId, { itemName: item.itemName, total: item.quantity, notes: item.note ? [item.note] : [] });
    }
  }

  const summary = Array.from(map.entries()).map(([itemId, v]) => ({
    itemId,
    itemName: v.itemName,
    total: v.total,
    notes: [...new Set(v.notes)].join("; "),
  }));

  return NextResponse.json({ summary, section: { id: resolvedSectionId } });
}
