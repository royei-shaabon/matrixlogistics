import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getAdminDb();
  const doc = await db.collection(COLLECTIONS.users).doc(session.userId).get();
  if (!doc.exists) redirect("/login");

  const user = doc.data()!;
  if (user.role === "admin") redirect("/admin");
  if (user.status === "pending") redirect("/pending");
  redirect("/order");
}
