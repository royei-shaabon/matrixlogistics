import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

async function getActiveSection(db: FirebaseFirestore.Firestore, environmentId: string) {
  const snap = await db
    .collection(COLLECTIONS.sections)
    .where("environmentId", "==", environmentId)
    .where("status", "==", "active")
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as {
    id: string; startDateTime: string; endDateTime: string; name: string; status: string; environmentId: string;
  };
}

export async function GET() {
  const session = await getSession();
  if (!session || !session.currentEnvironmentId) {
    return NextResponse.json({ error: "לא מחובר לסביבה" }, { status: 401 });
  }

  const envId = session.currentEnvironmentId;
  const db = getAdminDb();
  const section = await getActiveSection(db, envId);
  if (!section) return NextResponse.json({ items: [], sectionId: null });

  const ordersSnap = await db
    .collection(COLLECTIONS.orders)
    .where("sectionId", "==", section.id)
    .where("userId", "==", session.userId)
    .limit(1)
    .get();

  if (ordersSnap.empty) return NextResponse.json({ items: [], sectionId: section.id, section });

  const orderId = ordersSnap.docs[0].id;
  const itemsSnap = await db
    .collection(COLLECTIONS.orderItems)
    .where("orderId", "==", orderId)
    .get();

  const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ items, sectionId: section.id, section });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.currentEnvironmentId) {
    return NextResponse.json({ error: "לא מחובר לסביבה" }, { status: 401 });
  }

  const envId = session.currentEnvironmentId;

  if (session.globalStatus === "blocked") {
    return NextResponse.json({ error: "המשתמש חסום" }, { status: 403 });
  }

  // Must be approved in environment (admins can also submit)
  if (!isEnvAdmin(session) && session.environmentStatus !== "approved") {
    return NextResponse.json({ error: "המשתמש לא מאושר" }, { status: 403 });
  }

  const db = getAdminDb();
  const section = await getActiveSection(db, envId);
  if (!section) return NextResponse.json({ error: "אין סקשן פעיל" }, { status: 400 });

  const now = new Date().toISOString();
  if (now < section.startDateTime || now > section.endDateTime) {
    return NextResponse.json({ error: "ההזמנה אינה פתוחה כרגע" }, { status: 400 });
  }

  const userDoc = await db.collection(COLLECTIONS.users).doc(session.userId).get();
  if (!userDoc.exists) return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  const userData = userDoc.data()!;

  const body = await req.json();
  const { items } = body as { items: { itemId: string; quantity: number; notes?: string }[] };
  if (!Array.isArray(items)) return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });

  // Get or create order
  const existingSnap = await db
    .collection(COLLECTIONS.orders)
    .where("sectionId", "==", section.id)
    .where("userId", "==", session.userId)
    .limit(1)
    .get();

  let orderId: string;
  if (!existingSnap.empty) {
    orderId = existingSnap.docs[0].id;
    await db.collection(COLLECTIONS.orders).doc(orderId).update({ updatedAt: FieldValue.serverTimestamp() });
  } else {
    const orderRef = await db.collection(COLLECTIONS.orders).add({
      environmentId: envId,
      sectionId: section.id,
      userId: session.userId,
      userFullName: userData.fullName,
      email: userData.email,
      phoneNumber: userData.phoneNumber || "",
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    orderId = orderRef.id;
  }

  // Fetch item names from Firestore
  const itemIds = items.filter((i) => i.quantity > 0).map((i) => i.itemId);
  const itemDocs = itemIds.length > 0
    ? await Promise.all(itemIds.map((id) => db.collection(COLLECTIONS.items).doc(id).get()))
    : [];
  const itemMap: Record<string, string> = {};
  itemDocs.forEach((d) => { if (d.exists) itemMap[d.id] = d.data()!.name; });

  // Replace all order items atomically
  const existingItems = await db.collection(COLLECTIONS.orderItems).where("orderId", "==", orderId).get();
  const newItems = items.filter((item) => item.quantity > 0);
  const batch = db.batch();
  existingItems.docs.forEach((d) => batch.delete(d.ref));
  newItems.forEach((item) => {
    const ref = db.collection(COLLECTIONS.orderItems).doc();
    batch.set(ref, {
      environmentId: envId,
      sectionId: section.id,
      orderId,
      itemId: item.itemId,
      itemNameSnapshot: itemMap[item.itemId] || item.itemId,
      quantity: item.quantity,
      note: item.notes || "",
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();

  return NextResponse.json({ ok: true });
}
