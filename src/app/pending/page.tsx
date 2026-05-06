"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PendingPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.push("/login");
        else if (d.user.status === "approved") router.push("/order");
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F9FBFD" }}>
      <div className="w-full max-w-sm text-center">
        <div
          className="bg-white p-8 rounded-[18px]"
          style={{ boxShadow: "0px 4px 12px rgba(15,23,42,0.06)", border: "1px solid #DCE7F3" }}
        >
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 mx-auto"
            style={{ background: "#FEF9C3" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "#1E293B" }}>ממתין לאישור מנהל</h1>
          <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
            פרטיך נשמרו בהצלחה. המנהל יאשר את גישתך בהקדם.
            <br />
            לאחר האישור תוכל להתחבר ולהגיש בקשה.
          </p>
          <button
            onClick={handleLogout}
            className="mt-8 text-sm font-medium underline transition-colors"
            style={{ color: "#94A3B8" }}
          >
            יציאה מהמערכת
          </button>
        </div>
      </div>
    </div>
  );
}
