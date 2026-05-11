import { NextRequest, NextResponse } from "next/server";
import { getSession, isEnvAdmin } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  const db = getAdminDb();
  const doc = await db.collection(COLLECTIONS.generalOrderDetails).doc("current").get();
  if (!doc.exists) {
    return NextResponse.json({
      details: {
        orderDate: "",
        requesterName: "",
        phoneNumber: "",
        customerSite: "שלישות רמת גן",
        deliveryAddress: "בן גוריון 100, רמת גן",
        matrixEmployeesCount: "",
        courierNotes: "נא להתקשר חצי שעה לפני הגעה",
      },
    });
  }
  return NextResponse.json({ details: doc.data() });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || !isEnvAdmin(session)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const body = await req.json();
  const db = getAdminDb();

  await db.collection(COLLECTIONS.generalOrderDetails).doc("current").set(
    {
      ...body,
      customerSite: "שלישות רמת גן",
      deliveryAddress: "בן גוריון 100, רמת גן",
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: session.userId,
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
