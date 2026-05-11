import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.globalRole === "super_admin" && !session.currentEnvironmentId) {
    redirect("/super-admin");
  }

  if (!session.currentEnvironmentId) {
    redirect("/environments");
  }

  if (session.environmentStatus === "pending") redirect("/pending");
  if (session.environmentStatus === "blocked") redirect("/environments");

  if (session.environmentRole === "environment_admin" || session.globalRole === "super_admin") {
    redirect("/admin");
  }

  redirect("/order");
}
