"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Environment {
  id: string;
  name: string;
  description?: string;
  status?: string;
  requireApproval?: boolean;
  createdAt?: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  memberCount?: number;
  orderCount?: number;
}

interface GlobalUser {
  id: string;
  email: string;
  fullName: string;
  globalRole: string;
  globalStatus: string;
  createdAt?: string;
}

const ENV_STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  active:   { bg: "#DCFCE7", color: "#15803D", label: "פעיל" },
  pending:  { bg: "#FEF9C3", color: "#92400E", label: "ממתין לאישור" },
  rejected: { bg: "#FEE2E2", color: "#DC2626", label: "נדחה" },
};

export default function SuperAdminPage() {
  const router = useRouter();
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"envs" | "users">("envs");

  // Env actions
  const [entering, setEntering] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deletingEnv, setDeletingEnv] = useState<string | null>(null);
  const [editEnv, setEditEnv] = useState<Environment | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // User actions
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  // Env filter
  const [envFilter, setEnvFilter] = useState<"all" | "pending" | "active" | "rejected">("all");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user || d.user.globalRole !== "super_admin") { router.push("/"); return; }
    });
    loadAll();
  }, [router]);

  async function loadAll() {
    const [envData, userData] = await Promise.all([
      fetch("/api/environments").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]);
    setEnvs(envData.environments || []);
    setUsers(userData.users || []);
    setLoading(false);
  }

  async function handleEnvStatus(id: string, status: string) {
    setUpdating(id);
    await fetch(`/api/environments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setEnvs((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
    setUpdating(null);
  }

  async function handleDeleteEnv(env: Environment) {
    if (!confirm(`למחוק את הסביבה "${env.name}"? כל החברים יוסרו. פעולה זו אינה הפיכה.`)) return;
    setDeletingEnv(env.id);
    await fetch(`/api/environments/${env.id}`, { method: "DELETE" });
    setEnvs((prev) => prev.filter((e) => e.id !== env.id));
    setDeletingEnv(null);
  }

  async function handleEnterEnv(id: string) {
    setEntering(id);
    const res = await fetch(`/api/environments/${id}/enter`, { method: "POST" });
    const data = await res.json();
    setEntering(null);
    if (res.ok) router.push(data.redirect || "/admin");
  }

  function openEditEnv(env: Environment) {
    setEditName(env.name);
    setEditDesc(env.description || "");
    setEditEnv(env);
  }

  async function handleSaveEnv() {
    if (!editEnv) return;
    setEditSaving(true);
    await fetch(`/api/environments/${editEnv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, description: editDesc }),
    });
    setEnvs((prev) => prev.map((e) => e.id === editEnv.id ? { ...e, name: editName, description: editDesc } : e));
    setEditSaving(false);
    setEditEnv(null);
  }

  async function handleToggleUserBlock(user: GlobalUser) {
    const newStatus = user.globalStatus === "blocked" ? "active" : "blocked";
    if (newStatus === "blocked" && !confirm(`לחסום את ${user.fullName || user.email}?`)) return;
    setUpdatingUser(user.id);
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ globalStatus: newStatus }),
    });
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, globalStatus: newStatus } : u));
    setUpdatingUser(null);
  }

  async function handleLogout() {
    const { signOut } = await import("firebase/auth");
    const { getFirebaseAuth } = await import("@/lib/firebase-client");
    await signOut(getFirebaseAuth());
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const pendingEnvs = envs.filter((e) => e.status === "pending");
  const filteredEnvs = envFilter === "all" ? envs : envs.filter((e) => e.status === envFilter);
  const blockedUsers = users.filter((u) => u.globalStatus === "blocked");

  return (
    <div className="min-h-screen" style={{ background: "#0F172A", paddingBottom: "40px" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-start justify-between">
        <div>
          <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ background: "#1E293B", color: "#94A3B8" }}>SUPER ADMIN</span>
          <h1 className="text-xl font-bold mt-2" style={{ color: "#F1F5F9" }}>Get Supply Dashboard</h1>
        </div>
        <div className="flex gap-2 mt-1">
          <Link href="/environments" className="text-xs font-medium px-3 py-1.5 rounded-xl border" style={{ color: "#94A3B8", borderColor: "#334155", background: "#1E293B" }}>
            בחר סביבה
          </Link>
          <button onClick={handleLogout} className="text-xs font-medium px-3 py-1.5 rounded-xl border" style={{ color: "#94A3B8", borderColor: "#334155", background: "#1E293B" }}>
            יציאה
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* KPI */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[18px] p-4" style={{ background: "#1E293B", border: "1px solid #334155" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>סביבות</p>
            <p className="text-2xl font-bold" style={{ color: "#3B82F6" }}>{envs.length}</p>
          </div>
          <div className="rounded-[18px] p-4" style={{ background: pendingEnvs.length > 0 ? "#1C1208" : "#1E293B", border: `1px solid ${pendingEnvs.length > 0 ? "#78350F" : "#334155"}` }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>ממתינות</p>
            <p className="text-2xl font-bold" style={{ color: pendingEnvs.length > 0 ? "#F59E0B" : "#475569" }}>{pendingEnvs.length}</p>
          </div>
          <div className="rounded-[18px] p-4" style={{ background: "#1E293B", border: "1px solid #334155" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>משתמשים</p>
            <p className="text-2xl font-bold" style={{ color: "#22C55E" }}>{users.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {([
            { key: "envs", label: `סביבות (${envs.length})` },
            { key: "users", label: `משתמשים (${users.length})` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: activeTab === key ? "#3B82F6" : "#1E293B",
                color: activeTab === key ? "#FFFFFF" : "#64748B",
                border: `1px solid ${activeTab === key ? "#3B82F6" : "#334155"}`,
              }}
            >
              {label}
              {key === "envs" && pendingEnvs.length > 0 && (
                <span className="mr-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold" style={{ background: "#F59E0B", color: "#1C1208" }}>
                  {pendingEnvs.length}
                </span>
              )}
              {key === "users" && blockedUsers.length > 0 && (
                <span className="mr-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold" style={{ background: "#EF4444", color: "#FFFFFF" }}>
                  {blockedUsers.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm" style={{ color: "#475569" }}>טוען...</div>
        ) : (
          <>
            {/* Environments tab */}
            {activeTab === "envs" && (
              <div className="space-y-3">
                {/* Filter pills */}
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {([
                    { key: "all", label: "הכל" },
                    { key: "pending", label: "ממתינות" },
                    { key: "active", label: "פעילות" },
                    { key: "rejected", label: "נדחו" },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setEnvFilter(key)}
                      className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: envFilter === key ? "#3B82F6" : "#1E293B",
                        color: envFilter === key ? "#FFFFFF" : "#64748B",
                        border: `1px solid ${envFilter === key ? "#3B82F6" : "#334155"}`,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {filteredEnvs.length === 0 ? (
                  <div className="rounded-[18px] p-8 text-center text-sm" style={{ background: "#1E293B", border: "1px solid #334155", color: "#475569" }}>אין סביבות</div>
                ) : (
                  filteredEnvs.map((env) => {
                    const st = ENV_STATUS_STYLE[env.status || "active"] || ENV_STATUS_STYLE.active;
                    const isPending = env.status === "pending";
                    const isDeleting = deletingEnv === env.id;
                    const isUpdating = updating === env.id;
                    return (
                      <div
                        key={env.id}
                        className="rounded-[18px] p-4"
                        style={{ background: isPending ? "#1C1208" : "#1E293B", border: `1px solid ${isPending ? "#78350F" : "#334155"}` }}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm" style={{ color: "#F1F5F9" }}>{env.name}</p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg + "22", color: st.color, border: `1px solid ${st.bg}` }}>
                                {st.label}
                              </span>
                              {env.requireApproval === false && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#1E3A5F", color: "#60A5FA", border: "1px solid #1D4ED8" }}>
                                  הצטרפות חופשית
                                </span>
                              )}
                            </div>
                            {env.ownerName && (
                              <p className="text-xs mt-1" style={{ color: "#64748B" }}>
                                נוצר ע"י <span style={{ color: "#94A3B8" }}>{env.ownerName}</span>
                                {env.ownerEmail && env.ownerEmail !== env.ownerName && (
                                  <span style={{ color: "#475569" }}> · {env.ownerEmail}</span>
                                )}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs font-medium" style={{ color: "#64748B" }}>
                                👥 <span style={{ color: "#94A3B8" }}>{env.memberCount ?? 0}</span> חברים
                              </span>
                              <span className="text-xs font-medium" style={{ color: "#64748B" }}>
                                📦 <span style={{ color: "#94A3B8" }}>{env.orderCount ?? 0}</span> הזמנות
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleEnvStatus(env.id, "active")}
                                disabled={isUpdating}
                                className="text-xs font-semibold px-3 transition-all"
                                style={{ height: "32px", borderRadius: "8px", background: "#16A34A", color: "#FFFFFF", opacity: isUpdating ? 0.6 : 1 }}
                              >
                                {isUpdating ? "..." : "אשר"}
                              </button>
                              <button
                                onClick={() => handleEnvStatus(env.id, "rejected")}
                                disabled={isUpdating}
                                className="text-xs font-semibold px-3 transition-all"
                                style={{ height: "32px", borderRadius: "8px", background: "#7F1D1D", color: "#FCA5A5", opacity: isUpdating ? 0.6 : 1 }}
                              >
                                דחה
                              </button>
                            </>
                          )}
                          {env.status === "active" && (
                            <button
                              onClick={() => handleEnterEnv(env.id)}
                              disabled={entering === env.id}
                              className="text-xs font-semibold px-3 transition-all"
                              style={{ height: "32px", borderRadius: "8px", background: "#3B82F6", color: "#FFFFFF", opacity: entering === env.id ? 0.6 : 1 }}
                            >
                              {entering === env.id ? "..." : "כנס"}
                            </button>
                          )}
                          {env.status === "rejected" && (
                            <button
                              onClick={() => handleEnvStatus(env.id, "active")}
                              disabled={isUpdating}
                              className="text-xs font-semibold px-3 transition-all"
                              style={{ height: "32px", borderRadius: "8px", background: "#1E293B", color: "#94A3B8", border: "1px solid #334155", opacity: isUpdating ? 0.6 : 1 }}
                            >
                              {isUpdating ? "..." : "אשר בכל זאת"}
                            </button>
                          )}
                          <button
                            onClick={() => openEditEnv(env)}
                            className="text-xs font-medium px-3 transition-all"
                            style={{ height: "32px", borderRadius: "8px", background: "#1E293B", color: "#94A3B8", border: "1px solid #334155" }}
                          >
                            ערוך
                          </button>
                          <button
                            onClick={() => handleDeleteEnv(env)}
                            disabled={isDeleting}
                            className="text-xs font-medium px-3 transition-all"
                            style={{ height: "32px", borderRadius: "8px", background: "#450A0A", color: "#FCA5A5", border: "1px solid #7F1D1D", opacity: isDeleting ? 0.6 : 1 }}
                          >
                            {isDeleting ? "..." : "מחק"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                <Link
                  href="/environments/create"
                  className="block rounded-[18px] p-4 text-center text-sm font-semibold transition-all"
                  style={{ background: "#1E293B", border: "1px dashed #334155", color: "#64748B" }}
                >
                  + צור סביבה חדשה
                </Link>
              </div>
            )}

            {/* Users tab */}
            {activeTab === "users" && (
              <div className="space-y-2">
                {users.length === 0 ? (
                  <div className="rounded-[18px] p-8 text-center text-sm" style={{ background: "#1E293B", border: "1px solid #334155", color: "#475569" }}>אין משתמשים</div>
                ) : (
                  users.map((user) => {
                    const isBlocked = user.globalStatus === "blocked";
                    const isSelf = user.email === "shaabon.royei@gmail.com";
                    return (
                      <div
                        key={user.id}
                        className="rounded-[18px] p-4"
                        style={{ background: isBlocked ? "#1C0A0A" : "#1E293B", border: `1px solid ${isBlocked ? "#7F1D1D" : "#334155"}` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className="font-semibold text-sm truncate" style={{ color: "#F1F5F9" }}>
                                {user.fullName || user.email}
                              </span>
                              {user.globalRole === "super_admin" && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#7C3AED", color: "#FFFFFF" }}>SUPER</span>
                              )}
                              {isBlocked && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#EF4444", color: "#FFFFFF" }}>חסום</span>
                              )}
                            </div>
                            <p className="text-xs truncate" style={{ color: "#475569" }}>{user.email}</p>
                          </div>
                          {!isSelf && (
                            <button
                              onClick={() => handleToggleUserBlock(user)}
                              disabled={updatingUser === user.id}
                              className="flex-shrink-0 text-xs font-semibold px-3 transition-all"
                              style={{
                                height: "32px", borderRadius: "8px",
                                background: isBlocked ? "#14532D" : "#450A0A",
                                color: isBlocked ? "#86EFAC" : "#FCA5A5",
                                border: `1px solid ${isBlocked ? "#166534" : "#7F1D1D"}`,
                                opacity: updatingUser === user.id ? 0.6 : 1,
                              }}
                            >
                              {updatingUser === user.id ? "..." : isBlocked ? "בטל חסימה" : "חסום"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit environment modal */}
      {editEnv && (
        <div className="fixed inset-0 z-[60] flex items-end" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setEditEnv(null)}>
          <div className="w-full rounded-t-[24px] p-5" style={{ background: "#1E293B", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4"><div className="w-10 h-1 rounded-full" style={{ background: "#334155" }} /></div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ color: "#F1F5F9" }}>עריכת סביבה</h2>
              <button onClick={() => setEditEnv(null)} style={{ color: "#64748B", fontSize: "20px", lineHeight: 1 }}>✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>שם הסביבה</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ height: "48px", borderRadius: "12px", border: "1px solid #334155", background: "#0F172A", color: "#F1F5F9" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>תיאור (אופציונלי)</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ height: "48px", borderRadius: "12px", border: "1px solid #334155", background: "#0F172A", color: "#F1F5F9" }}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSaveEnv}
                  disabled={editSaving || !editName.trim()}
                  className="flex-1 text-white font-semibold text-sm transition-all"
                  style={{ height: "50px", borderRadius: "14px", background: editSaving ? "#1D4ED8" : "#3B82F6", opacity: editSaving ? 0.7 : 1 }}
                >
                  {editSaving ? "שומר..." : "שמור"}
                </button>
                <button
                  onClick={() => setEditEnv(null)}
                  className="flex-1 font-semibold text-sm transition-all"
                  style={{ height: "50px", borderRadius: "14px", border: "1px solid #334155", color: "#64748B", background: "#0F172A" }}
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
