"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function JoinEnvironmentPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [envName, setEnvName] = useState("");
  const [envId, setEnvId] = useState("");
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    fetch(`/api/environments?inviteCode=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data) => {
        setLoading(false);
        if (data.error || !data.environments?.length) {
          setError("קוד הזמנה לא תקין או שפג תוקפו");
          return;
        }
        const env = data.environments[0];
        setEnvName(env.name);
        setEnvId(env.id);
      });
  }, [code]);

  async function handleJoin() {
    if (!envId) return;
    setJoining(true);
    setError("");
    const res = await fetch(`/api/environments/${envId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code }),
    });
    const data = await res.json();
    setJoining(false);
    if (!res.ok) { setError(data.error || "שגיאה בהצטרפות"); return; }
    setJoined(true);
    setTimeout(() => router.push("/environments"), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F9FBFD" }}>
        <p className="text-sm" style={{ color: "#94A3B8" }}>טוען...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F9FBFD" }}>
      <div className="w-full max-w-sm">
        <div className="bg-white p-8 rounded-[18px] text-center" style={{ boxShadow: "0px 4px 12px rgba(15,23,42,0.06)", border: "1px solid #DCE7F3" }}>
          {joined ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "#F0FDF4" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: "#1E293B" }}>הצטרפת בהצלחה!</h1>
              <p className="text-sm" style={{ color: "#64748B" }}>בקשתך נשלחה. המנהל יאשר את גישתך בקרוב.</p>
            </>
          ) : error ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "#FEF2F2" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: "#1E293B" }}>שגיאה</h1>
              <p className="text-sm mb-6" style={{ color: "#64748B" }}>{error}</p>
              <Link href="/environments" className="text-sm font-semibold" style={{ color: "#3B82F6" }}>
                חזרה לסביבות
              </Link>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "#EFF6FF" }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                </svg>
              </div>
              <h1 className="text-xl font-bold mb-1" style={{ color: "#1E293B" }}>הצטרפות לסביבה</h1>
              <p className="text-base font-semibold mb-1" style={{ color: "#3B82F6" }}>{envName}</p>
              <p className="text-sm mb-6" style={{ color: "#64748B" }}>לאחר ההצטרפות, המנהל יצטרך לאשר את גישתך</p>
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full text-white font-semibold text-sm transition-all"
                style={{ height: "52px", borderRadius: "14px", background: joining ? "#93C5FD" : "#3B82F6" }}
              >
                {joining ? "מצטרף..." : "הצטרף לסביבה"}
              </button>
              <Link href="/environments" className="block mt-4 text-sm" style={{ color: "#94A3B8" }}>
                ביטול
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
