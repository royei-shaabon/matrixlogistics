"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

interface Session {
  id: string;
  name: string;
  windowId: string;
  status: "open" | "closed";
  startDateTime: string;
  endDateTime: string;
  createdAt: string;
}

type EffectiveStatus = "pending" | "open" | "expired" | "closed";

function getEffectiveStatus(sess: Session): EffectiveStatus {
  if (sess.status === "closed") return "closed";
  const now = Date.now();
  if (now < new Date(sess.startDateTime).getTime()) return "pending";
  if (now > new Date(sess.endDateTime).getTime()) return "expired";
  return "open";
}

const STATUS_LABEL: Record<EffectiveStatus, string> = {
  pending: "ממתין",
  open: "פתוח",
  expired: "פג תוקף",
  closed: "סגור",
};
const STATUS_STYLE: Record<EffectiveStatus, { background: string; color: string }> = {
  pending: { background: "#FEF9C3", color: "#92400E" },
  open:    { background: "#DCFCE7", color: "#15803D" },
  expired: { background: "#FFEDD5", color: "#C2410C" },
  closed:  { background: "#F1F5F9", color: "#64748B" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("he-IL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user || d.user.role !== "admin") router.push("/login");
    });
    fetch("/api/users").then((r) => r.json()).then((d) => {
      if (d.users) setPendingCount(d.users.filter((u: { status: string }) => u.status === "pending").length);
    });
    loadSessions();
  }, [router]);

  async function loadSessions() {
    const res = await fetch("/api/admin/sessions");
    const data = await res.json();
    setSessions(data.sessions || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !startAt || !endAt) return;
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/admin/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, startDateTime: new Date(startAt).toISOString(), endDateTime: new Date(endAt).toISOString() }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setCreateError(data.error || "שגיאה ביצירה"); return; }
    setNewName(""); setStartAt(""); setEndAt("");
    loadSessions();
  }

  async function handleClose(id: string) {
    if (!confirm("לסגור את הסשן? משתמשים לא יוכלו להגיש הזמנות חדשות.")) return;
    setSaving(id + "_close");
    await fetch(`/api/admin/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ close: true }),
    });
    setSaving(null);
    loadSessions();
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    setSaving(id + "_rename");
    await fetch(`/api/admin/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    setSaving(null);
    setEditId(null);
    loadSessions();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`למחוק את הסשן "${name}"?\nניתן למחוק רק סשנים ללא הזמנות.`)) return;
    setSaving(id + "_delete");
    const res = await fetch(`/api/admin/sessions/${id}`, { method: "DELETE" });
    const data = await res.json();
    setSaving(null);
    if (!res.ok) { alert(data.error || "שגיאה במחיקה"); return; }
    loadSessions();
  }

  const openSession = sessions.find((s) => getEffectiveStatus(s) === "open");

  return (
    <div className="min-h-screen" style={{ background: "#F9FBFD", paddingBottom: "90px" }}>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>ניהול סשנים</h1>
        {openSession ? (
          <p className="text-sm mt-0.5" style={{ color: "#16A34A" }}>פתוח: {openSession.name}</p>
        ) : (
          <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>אין סשן פתוח</p>
        )}
      </div>

      <div className="px-4 space-y-3">
        {/* Create form */}
        <div
          className="rounded-[18px] p-4"
          style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}
        >
          <h2 className="text-sm font-bold mb-3" style={{ color: "#1E293B" }}>פתח סשן חדש</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="שם הסשן (לדוגמה: שבוע 18)"
              className="w-full border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ height: "44px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>מתאריך</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  required
                  className="w-full border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ height: "44px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>עד תאריך</label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  required
                  className="w-full border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ height: "44px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={creating || !newName.trim() || !startAt || !endAt}
              className="w-full text-white font-semibold text-sm transition-all"
              style={{ height: "44px", borderRadius: "12px", background: creating ? "#93C5FD" : "#3B82F6" }}
            >
              {creating ? "יוצר..." : "פתח סשן"}
            </button>
            {createError && <p className="text-xs" style={{ color: "#EF4444" }}>{createError}</p>}
          </form>
        </div>

        {/* Sessions list */}
        {loading ? (
          <div className="text-center py-12" style={{ color: "#94A3B8" }}>טוען...</div>
        ) : sessions.length === 0 ? (
          <div
            className="rounded-[18px] p-10 text-center text-sm"
            style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", color: "#94A3B8" }}
          >
            אין סשנים עדיין
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((sess) => {
              const effStatus = getEffectiveStatus(sess);
              const isOpen = effStatus === "open";
              const isSaving = saving?.startsWith(sess.id);
              const isEditing = editId === sess.id;

              return (
                <div
                  key={sess.id}
                  className="rounded-[18px] p-4"
                  style={{
                    background: "#FFFFFF",
                    border: `1px solid ${effStatus === "open" ? "#BBF7D0" : effStatus === "pending" ? "#FDE68A" : "#DCE7F3"}`,
                    boxShadow: "0px 4px 12px rgba(15,23,42,0.06)",
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          style={{ height: "40px", borderRadius: "10px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
                        />
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>{sess.name}</span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={STATUS_STYLE[effStatus]}
                          >
                            {STATUS_LABEL[effStatus]}
                          </span>
                        </div>
                      )}
                      {!isEditing && (
                        <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                          {formatDate(sess.startDateTime)} — {formatDate(sess.endDateTime)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleRename(sess.id)}
                          disabled={!!saving}
                          className="text-white text-xs font-semibold px-3 transition-all"
                          style={{ height: "32px", borderRadius: "8px", background: "#3B82F6" }}
                        >
                          שמור
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="text-xs font-medium px-3 border transition-all"
                          style={{ height: "32px", borderRadius: "8px", borderColor: "#DCE7F3", color: "#64748B" }}
                        >
                          ביטול
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => router.push(`/admin/summary?windowId=${sess.windowId}`)}
                          className="text-white text-xs font-semibold px-3 transition-all"
                          style={{ height: "32px", borderRadius: "8px", background: "#1E293B" }}
                        >
                          צפה בסיכום
                        </button>
                        {(effStatus === "open" || effStatus === "pending") && (
                          <button
                            onClick={() => handleClose(sess.id)}
                            disabled={isSaving}
                            className="text-xs font-medium px-3 border transition-all"
                            style={{ height: "32px", borderRadius: "8px", borderColor: "#FED7AA", color: "#C2410C", background: "#FFF7ED" }}
                          >
                            {saving === sess.id + "_close" ? "..." : "בטל סשן"}
                          </button>
                        )}
                        <button
                          onClick={() => { setEditId(sess.id); setEditName(sess.name); }}
                          className="text-xs font-medium px-3 border transition-all"
                          style={{ height: "32px", borderRadius: "8px", borderColor: "#DCE7F3", color: "#64748B", background: "#F8FAFC" }}
                        >
                          שנה שם
                        </button>
                        {(effStatus === "expired" || effStatus === "closed") && (
                          <button
                            onClick={() => handleDelete(sess.id, sess.name)}
                            disabled={isSaving}
                            className="text-xs font-medium px-3 border transition-all"
                            style={{ height: "32px", borderRadius: "8px", borderColor: "#FECACA", color: "#EF4444", background: "#FFF1F1" }}
                          >
                            {saving === sess.id + "_delete" ? "..." : "מחק"}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav isAdmin pendingCount={pendingCount > 0 ? pendingCount : undefined} />
    </div>
  );
}
