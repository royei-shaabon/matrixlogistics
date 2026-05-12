"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EnterEnvironmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    fetch(`/api/environments/${id}/enter`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          if (data.error === "Unauthorized") {
            router.push("/login");
            return;
          }
          setError(data.error);
          return;
        }
        router.push(data.redirect || "/order");
      })
      .catch(() => setError("שגיאה בכניסה לסביבה"));
  }, [id, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F9FBFD" }}>
        <div className="w-full max-w-sm text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "#FEF2F2" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-base font-semibold mb-2" style={{ color: "#1E293B" }}>לא ניתן להיכנס לסביבה</p>
          <p className="text-sm mb-6" style={{ color: "#64748B" }}>{error}</p>
          <button
            onClick={() => router.push("/environments")}
            className="text-sm font-semibold px-6 py-3 rounded-[14px] text-white"
            style={{ background: "#3B82F6" }}
          >
            חזור לסביבות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F9FBFD" }}>
      <div className="text-center">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{ background: "#EFF6FF" }}
        >
          <svg className="animate-spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25" />
            <path d="M21 12a9 9 0 00-9-9" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: "#64748B" }}>מכניסך לסשן...</p>
      </div>
    </div>
  );
}
