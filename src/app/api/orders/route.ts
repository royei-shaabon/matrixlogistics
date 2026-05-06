import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { PRODUCTS } from "@/lib/products";

async function getCurrentWindow(db: FirebaseFirestore.Firestore) {
  const doc = await db.collection(COLLECTIONS.orderWindow).doc("current").get();
  return doc.exists ? doc.data() : null;
}

async function getUserOrder(db: FirebaseFirestore.Firestore, userId: string, windowId: string) {
  const snap = await db
    .collection(COLLECTIONS.orders)
    .where("userId", "==", userId)
    .where("windowId", "==", windowId)
    .limit(1)
    .get();
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const db = getAdminDb();
  const window = await getCurrentWindow(db);
  if (!window) return NextResponse.json({ items: [], windowId: null });

  const order = await getUserOrder(db, session.userId, window.windowId);
  if (!order) return NextResponse.json({ items: [], windowId: window.windowId });

  const itemsSnap = await db
    .collection(COLLECTIONS.orderItems)
    .where("orderId", "==", order.id)
    .get();

  const items = itemsSnap.docs.map((d) => d.data());
  return NextResponse.json({ items, windowId: window.windowId });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "לא מחובר" }, { status: 401 });

  const db = getAdminDb();
  const window = await getCurrentWindow(db);
  if (!window) {
    return NextResponse.json({ error: "אין חלון הזמנה פעיל" }, { status: 400 });
  }

  const now = new Date().toISOString();
  if (now < window.startDateTime || now > window.endDateTime) {
    return NextResponse.json({ error: "ההזמנה אינה פתוחה כרגע" }, { status: 400 });
  }

  const userDoc = await db.collection(COLLECTIONS.users).doc(session.userId).get();
  const userData = userDoc.data()!;

  // Check live Firestore status — JWT can be stale after admin approval
  if (session.role !== "admin" && userData.status !== "approved") {
    return NextResponse.json({ error: "המשתמש לא מאושר" }, { status: 403 });
  }

  const body = await req.json();
  const { items } = body as { items: { product_id: number; quantity: number; notes?: string }[] };
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  // Get or create order for this user + window
  let orderId: string;
  const existingOrder = await getUserOrder(db, session.userId, window.windowId);

  if (existingOrder) {
    orderId = existingOrder.id;
    await db.collection(COLLECTIONS.orders).doc(orderId).update({
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    const orderRef = await db.collection(COLLECTIONS.orders).add({
      userId: session.userId,
      userFullName: userData.fullName,
      email: userData.email,
      branch: userData.branch,
      department: userData.department,
      windowId: window.windowId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    orderId = orderRef.id;
  }

  // Delete all existing items for this order
  const existingItems = await db
    .collection(COLLECTIONS.orderItems)
    .where("orderId", "==", orderId)
    .get();
  const deleteOps = existingItems.docs.map((d) => d.ref.delete());
  await Promise.all(deleteOps);

  // Add new items
  const addOps = items
    .filter((item) => item.quantity > 0)
    .map((item) => {
      const product = PRODUCTS.find((p) => p.id === item.product_id);
      return db.collection(COLLECTIONS.orderItems).add({
        orderId,
        itemId: item.product_id,
        itemName: product?.name || `פריט ${item.product_id}`,
        quantity: item.quantity,
        orderNote: item.notes || "",
      });
    });
  await Promise.all(addOps);

  return NextResponse.json({ ok: true });
}
