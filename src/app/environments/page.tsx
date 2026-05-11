"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Environment {
  id: string;
  name: string;
  description?: string;
  status?: string;
  memberStatus?: string;
  memberRole?: string;
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  );
}

function memberStatusLabel(status: string) {
  if (status === "approved") return { text: "מאושר", bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" };
  if (status === "pending") return { text: "ממתין לאישור", bg: "#FFFBEB", color: "#B45309", border: "#FDE68A" };
  return { text: "חסום", bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" };
}

function envStatusLabel() {
  return { text: "ממתין לאישור מנהל ראשי", bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" };
}

export default function EnvironmentsPage() {
  const router = useRouter();
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/environments").then((r) => r.json()),
    ]).then(([me, envData]) => {
      if (!me.user) { router.push("/login"); return; }
      setIsSuperAdmin(me.user.globalRole === "super_admin");
      setEnvs(envData.environments || []);
      setLoading(false);
    });
  }, [router]);

  async function handleEnter(id: string) {
    setEntering(id);
    setError("");
    const res = await fetch(`/api/environments/${id}/enter`, { method: "POST" });
    const data = await res.json();
    setEntering(null);
    if (!res.ok) { setError(data.error || "שגיאה בכניסה לסביבה"); return; }
    router.push(data.redirect || "/");
  }

  async function handleJoinByCode() {
    const code = inviteCode.trim();
    if (!code) return;
    router.push(`/environments/join/${code}`);
  }

  async function handleLogout() {
    const { signOut } = await import("firebase/auth");
    const { getFirebaseAuth } = await import("@/lib/firebase-client");
    await signOut(getFirebaseAuth());
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen" style={{ background: "#F9FBFD", paddingBottom: "40px" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>הסביבות שלי</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>בחר סביבה להיכנס</p>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors"
          style={{ color: "#64748B", borderColor: "#DCE7F3", background: "#FFFFFF" }}
        >
          יציאה
        </button>
      </div>

      <div className="px-4 space-y-3">
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: "#94A3B8" }}>טוען...</div>
        ) : envs.length === 0 ? (
          <div
            className="rounded-[18px] p-8 text-center bg-white"
            style={{ border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "#EFF6FF", color: "#3B82F6" }}>
              <GlobeIcon />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "#1E293B" }}>אין לך סביבות עדיין</p>
            <p className="text-xs" style={{ color: "#64748B" }}>צור סביבה חדשה או הצטרף באמצעות קוד הזמנה</p>
          </div>
        ) : (
          envs.map((env) => {
            const envPending = env.status === "pending";
            const badge = envPending
              ? envStatusLabel()
              : env.memberStatus
              ? memberStatusLabel(env.memberStatus)
              : null;
            const canEnter = !envPending && (!env.memberStatus || env.memberStatus === "approved");
            return (
              <div
                key={env.id}
                className="rounded-[18px] p-4 bg-white flex items-center gap-4"
                style={{ border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#EFF6FF", color: "#3B82F6" }}>
                  <GlobeIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "#1E293B" }}>{env.name}</p>
                  {env.description && <p className="text-xs mt-0.5 truncate" style={{ color: "#64748B" }}>{env.description}</p>}
                  {badge && (
                    <span
                      className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1"
                      style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                    >
                      {badge.text}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleEnter(env.id)}
                  disabled={entering === env.id || !canEnter}
                  className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                  style={{
                    background: canEnter ? "#3B82F6" : "#F1F5F9",
                    color: canEnter ? "#FFFFFF" : "#94A3B8",
                    opacity: entering === env.id ? 0.7 : 1,
                  }}
                >
                  {entering === env.id ? "..." : "כניסה"}
                </button>
              </div>
            );
          })
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            href="/environments/create"
            className="rounded-[18px] p-4 bg-white flex flex-col items-center gap-2 border transition-all"
            style={{ border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-light" style={{ background: "#EFF6FF", color: "#3B82F6" }}>+</div>
            <span className="text-sm font-semibold" style={{ color: "#1E293B" }}>צור סביבה</span>
          </Link>

          <div
            className="rounded-[18px] p-4 bg-white flex flex-col items-center gap-2"
            style={{ border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}
          >
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="קוד הזמנה"
              className="w-full text-center text-sm border px-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ height: "40px", borderRadius: "10px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
            />
            <button
              onClick={handleJoinByCode}
              className="w-full text-sm font-semibold py-2 rounded-xl text-white transition-all"
              style={{ background: inviteCode.trim() ? "#3B82F6" : "#CBD5E1" }}
            >
              הצטרף
            </button>
          </div>
        </div>

        {isSuperAdmin && (
          <Link
            href="/super-admin"
            className="block w-full rounded-[14px] py-3 text-center text-sm font-semibold transition-all"
            style={{ background: "#1E293B", color: "#FFFFFF" }}
          >
            Super Admin Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
