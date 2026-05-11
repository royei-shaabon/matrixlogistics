"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateEnvironmentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/environments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "שגיאה ביצירת הסביבה"); return; }
    const envId = data.id;
    const enterRes = await fetch(`/api/environments/${envId}/enter`, { method: "POST" });
    const enterData = await enterRes.json();
    router.push(enterData.redirect || "/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F9FBFD" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "#3B82F6" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>צור סביבה חדשה</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>הסביבה היא מרחב עבודה נפרד עם פריטים ומשתמשים משלה</p>
        </div>

        <div className="bg-white p-6 rounded-[18px]" style={{ boxShadow: "0px 4px 12px rgba(15,23,42,0.06)", border: "1px solid #DCE7F3" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#1E293B" }}>שם הסביבה *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="למשל: Get Supply ראשי"
                className="w-full border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                style={{ height: "52px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#1E293B" }}>תיאור (אופציונלי)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="תיאור קצר של הסביבה"
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
              disabled={loading || !name.trim()}
              className="w-full text-white font-semibold text-sm transition-all"
              style={{ height: "52px", borderRadius: "14px", background: loading || !name.trim() ? "#93C5FD" : "#3B82F6" }}
            >
              {loading ? "יוצר..." : "צור סביבה וכנס"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "#64748B" }}>
          <Link href="/environments" className="font-semibold" style={{ color: "#3B82F6" }}>
            חזרה לרשימת הסביבות
          </Link>
        </p>
      </div>
    </div>
  );
}
