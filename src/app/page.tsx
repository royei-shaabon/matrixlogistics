import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPage from "./_components/LandingPage";

export default async function Home() {
  const session = await getSession();

  if (session) {
    if (session.globalRole === "super_admin" && !session.currentEnvironmentId) redirect("/super-admin");
    if (!session.currentEnvironmentId) redirect("/environments");
    if (session.environmentStatus === "pending") redirect("/pending");
    if (session.environmentStatus === "blocked") redirect("/environments");
    if (session.environmentRole === "environment_admin" || session.globalRole === "super_admin") redirect("/admin");
    redirect("/order");
  }

  return <LandingPage />;
}
