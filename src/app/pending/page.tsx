"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PendingPage() {
  const router = useRouter();
  const [envName, setEnvName] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) { router.push("/login"); return; }
        if (d.user.environmentStatus === "approved") { router.push("/"); return; }
        if (d.user.currentEnvironmentId) {
          fetch(`/api/environments/${d.user.currentEnvironmentId}`)
            .then((r) => r.json())
            .then((env) => { if (env.name) setEnvName(env.name); });
        }
      });
  }, [router]);

  async function handleCheck() {
    setChecking(true);
    const d = await fetch("/api/auth/me").then((r) => r.json());
    setChecking(false);
    if (!d.user) { router.push("/login"); return; }
    if (d.user.environmentStatus === "approved") { router.push("/"); return; }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F9FBFD" }}>
      <div className="w-full max-w-sm text-center">
        <div className="bg-white p-8 rounded-[18px]" style={{ boxShadow: "0px 4px 12px rgba(15,23,42,0.06)", border: "1px solid #DCE7F3" }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 mx-auto" style={{ background: "#FEF9C3" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "#1E293B" }}>ממתין לאישור מנהל</h1>
          {envName && (
            <p className="text-xs font-semibold mb-3 px-3 py-1.5 rounded-full inline-block" style={{ background: "#EFF6FF", color: "#3B82F6" }}>
              {envName}
            </p>
          )}
          <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
            בקשת הצטרפותך נשמרה. המנהל יאשר את גישתך בהקדם.
          </p>
          <div className="flex flex-col gap-2 mt-8">
            <button
              onClick={handleCheck}
              disabled={checking}
              className="text-sm font-semibold py-2.5 rounded-xl text-white transition-all"
              style={{ background: checking ? "#93C5FD" : "#3B82F6" }}
            >
              {checking ? "בודק..." : "בדוק שוב"}
            </button>
            <button
              onClick={() => router.push("/environments")}
              className="text-sm font-semibold py-2.5 rounded-xl transition-all"
              style={{ background: "#EFF6FF", color: "#3B82F6" }}
            >
              בחר סביבה אחרת
            </button>
            <button
              onClick={handleLogout}
              className="text-sm font-medium underline transition-colors"
              style={{ color: "#94A3B8" }}
            >
              יציאה מהמערכת
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
