"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";

const PHONE_REGEX = /^(05\d{8}|\+9725\d{8})$/;

export default function CompleteRegistrationPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push("/login"); return; }
      setDisplayName(user.displayName || "");
      setChecking(false);
    });
    return () => unsubscribe();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!PHONE_REGEX.test(phone.replace(/-/g, ""))) {
      setError("פורמט מספר הטלפון אינו תקין");
      return;
    }
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) { router.push("/login"); return; }
      const token = await user.getIdToken();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: displayName, phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "שגיאה בהרשמה"); return; }
      router.push("/environments");
    } catch {
      setError("שגיאה, נסה שנית");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F9FBFD" }}>
        <div className="text-sm" style={{ color: "#94A3B8" }}>טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F9FBFD" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "#3B82F6" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>השלמת פרטים</h1>
          {displayName && <p className="text-sm mt-1" style={{ color: "#64748B" }}>שלום, {displayName}</p>}
        </div>

        <div className="bg-white p-6 rounded-[18px]" style={{ boxShadow: "0px 4px 12px rgba(15,23,42,0.06)", border: "1px solid #DCE7F3" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#1E293B" }}>שם מלא</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                style={{ height: "52px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#1E293B" }}>מספר טלפון</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="050-0000000"
                className="w-full border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                style={{ height: "52px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold text-sm transition-all"
              style={{ height: "52px", borderRadius: "14px", background: loading ? "#93C5FD" : "#3B82F6" }}
            >
              {loading ? "שולח..." : "סיום הרשמה"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
