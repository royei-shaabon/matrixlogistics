"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

interface Section {
  id: string;
  name: string;
  status: "open" | "closed";
  startDateTime: string;
  endDateTime: string;
  createdAt: string;
}

interface SummaryRow {
  itemId: string;
  itemName: string;
  total: number;
  notes: string;
}

interface DetailRow {
  itemDocId: string;
  userId: string;
  userFullName: string;
  email: string;
  phoneNumber: string;
  itemName: string;
  quantity: number;
  note: string;
  status: "active" | "blocked";
}

type EffectiveStatus = "pending" | "open" | "expired" | "closed";

function getEffectiveStatus(sess: Section): EffectiveStatus {
  if (sess.status === "closed") return "closed";
  const now = Date.now();
  if (now < new Date(sess.startDateTime).getTime()) return "pending";
  if (now > new Date(sess.endDateTime).getTime()) return "expired";
  return "open";
}

const STATUS_LABEL: Record<EffectiveStatus, string> = {
  pending: "ממתין", open: "פתוח", expired: "פג תוקף", closed: "סגור",
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

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", height: "44px", borderRadius: "12px",
  border: "1px solid #DCE7F3", background: "#F8FAFC",
  padding: "0 12px", fontSize: "14px", outline: "none",
  boxSizing: "border-box",
};

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [envId, setEnvId] = useState("");
  const [envName, setEnvName] = useState("");
  const [userName, setUserName] = useState("");
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  // PDF modal state
  const [pdfSession, setPdfSession] = useState<Section | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfSummary, setPdfSummary] = useState<SummaryRow[]>([]);
  const [pdfDetails, setPdfDetails] = useState<DetailRow[]>([]);
  const [pdfFetching, setPdfFetching] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showSummaryTable, setShowSummaryTable] = useState(true);
  const [showDetailsTable, setShowDetailsTable] = useState(true);
  const [headerOrg, setHeaderOrg] = useState("");
  const [headerDate, setHeaderDate] = useState("");
  const [headerRef, setHeaderRef] = useState("");
  const [headerNotes, setHeaderNotes] = useState("");
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user) { router.push("/login"); return; }
      const isAdmin = d.user.globalRole === "super_admin" || d.user.environmentRole === "environment_admin";
      if (!isAdmin) { router.push("/order"); return; }
      setUserName(d.user.fullName || d.user.name || "");
      const eid = d.user.currentEnvironmentId;
      if (eid) {
        setEnvId(eid);
        fetch(`/api/environments/${eid}`).then((r) => r.json()).then((env) => {
          if (env.name) setEnvName(env.name);
        });
        fetch(`/api/environments/${eid}/items`).then((r) => r.json()).then((data) => {
          const active = (data.items || []).filter((i: { status?: string }) => i.status !== "inactive");
          setItemCount(active.length);
        });
      }
    });
    fetch("/api/users").then((r) => r.json()).then((d) => {
      if (d.users) setPendingCount(d.users.filter((u: { memberStatus: string }) => u.memberStatus === "pending").length);
    });
    loadSessions();
  }, [router]);

  async function loadSessions() {
    try {
      const res = await fetch("/api/admin/sessions");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      // keep existing sessions on network error
    } finally {
      setLoading(false);
    }
  }

  async function handleShare(sess: Section) {
    const link = `${window.location.origin}/environments/${envId}/enter`;
    let code = "";
    try {
      const r = await fetch(`/api/environments/${envId}/invite`);
      const d = await r.json();
      if (d.inviteCode) {
        code = d.inviteCode.slice(0, 8);
      } else {
        const r2 = await fetch(`/api/environments/${envId}/invite`, { method: "POST" });
        const d2 = await r2.json();
        code = (d2.inviteCode || "").slice(0, 8);
      }
    } catch { /* ignore */ }
    const by = userName ? ` של ${userName}` : "";
    const env = envName ? ` ב${envName}` : "";
    const msg = `הוזמנת לסשן "${sess.name}"${by}${env}${code ? `\nקוד הזמנה: ${code}` : ""}\n${link}`;
    navigator.clipboard.writeText(msg);
    setShareMsg(sess.id);
    setTimeout(() => setShareMsg(null), 2000);
  }

  async function handleCreate(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!newName.trim() || !startAt || !endAt) return;
    if (itemCount === 0) {
      setCreateError("לא ניתן ליצור סשן הגשה ללא פריטים. יש להוסיף פריטים תחילה.");
      return;
    }
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
    if (!confirm("לסגור את הסשן?")) return;
    setSaving(id + "_close");
    const res = await fetch(`/api/admin/sessions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ close: true }) });
    setSaving(null);
    if (!res.ok) { const d = await res.json(); alert(d.error || "שגיאה בסגירה"); return; }
    loadSessions();
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    setSaving(id + "_rename");
    const res = await fetch(`/api/admin/sessions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editName }) });
    setSaving(null);
    if (!res.ok) { const d = await res.json(); alert(d.error || "שגיאה בשינוי שם"); return; }
    setEditId(null);
    loadSessions();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`למחוק את הסשן "${name}"?`)) return;
    setSaving(id + "_delete");
    const res = await fetch(`/api/admin/sessions/${id}`, { method: "DELETE" });
    const data = await res.json();
    setSaving(null);
    if (!res.ok) { alert(data.error || "שגיאה במחיקה"); return; }
    loadSessions();
  }

  async function openPdfModal(sess: Section) {
    setPdfSession(sess);
    setPdfSummary([]);
    setPdfDetails([]);
    setHeaderOrg("");
    setHeaderDate(new Date().toLocaleDateString("he-IL"));
    setHeaderRef("");
    setHeaderNotes("");
    setShowSummaryTable(true);
    setShowDetailsTable(true);
    setPdfModalOpen(true);
    setPdfFetching(true);
    const [s, d] = await Promise.all([
      fetch(`/api/admin/summary?sectionId=${sess.id}`).then((r) => r.json()),
      fetch(`/api/admin/details?sectionId=${sess.id}`).then((r) => r.json()),
    ]);
    setPdfSummary(s.summary || []);
    setPdfDetails(d.details || []);
    setPdfFetching(false);
  }

  async function handleExportPDF() {
    if (!pdfRef.current) return;
    setPdfLoading(true);
    try {
      const html2pdf = (await import("html2pdf.js" as string)).default;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `הזמנת-אספקה-${pdfSession?.name || ""}-${new Date().toLocaleDateString("he-IL").replace(/\//g, "-")}.pdf`,
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };
      await html2pdf().set(opt).from(pdfRef.current).save();
    } finally {
      setPdfLoading(false);
    }
  }

  const openSession = sessions.find((s) => getEffectiveStatus(s) === "open");
  const hasHeader = !!(headerOrg || headerRef || headerNotes);
  const activeDetails = pdfDetails.filter((d) => d.status !== "blocked");
  const totalQty = pdfSummary.reduce((acc, r) => acc + r.total, 0);

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
        <div className="rounded-[18px] p-4" style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}>
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
                <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required className="w-full border focus:outline-none focus:ring-2 focus:ring-blue-400" style={{ height: "44px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC", fontSize: "14px", padding: "0 6px", minWidth: 0 }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>עד תאריך</label>
                <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required className="w-full border focus:outline-none focus:ring-2 focus:ring-blue-400" style={{ height: "44px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC", fontSize: "14px", padding: "0 6px", minWidth: 0 }} />
              </div>
            </div>
            {(() => {
              const formReady = newName.trim() && startAt && endAt;
              return (
                <button
                  type="submit"
                  disabled={creating || !formReady}
                  className="w-full font-semibold text-sm transition-all"
                  style={{
                    height: "44px", borderRadius: "12px",
                    background: creating ? "#93C5FD" : formReady ? "#3B82F6" : "#E2E8F0",
                    color: formReady || creating ? "#FFFFFF" : "#94A3B8",
                    cursor: formReady ? "pointer" : "not-allowed",
                  }}
                >
                  {creating ? "יוצר..." : "פתח סשן"}
                </button>
              );
            })()}
            {createError && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                <p className="font-medium mb-2" style={{ color: "#EF4444" }}>{createError}</p>
                {itemCount === 0 && (
                  <button
                    type="button"
                    onClick={() => router.push("/admin/items")}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                    style={{ background: "#3B82F6" }}
                  >
                    הוסף פריטים
                  </button>
                )}
              </div>
            )}
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12" style={{ color: "#94A3B8" }}>טוען...</div>
        ) : sessions.length === 0 ? (
          <div className="rounded-[18px] p-10 text-center text-sm" style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", color: "#94A3B8" }}>אין סשנים עדיין</div>
        ) : (
          <div className="space-y-2">
            {sessions.map((sess) => {
              const effStatus = getEffectiveStatus(sess);
              const isSaving = saving?.startsWith(sess.id);
              const isEditing = editId === sess.id;
              return (
                <div key={sess.id} className="rounded-[18px] p-4" style={{ background: "#FFFFFF", border: `1px solid ${effStatus === "open" ? "#BBF7D0" : effStatus === "pending" ? "#FDE68A" : "#DCE7F3"}`, boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input autoFocus type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" style={{ height: "40px", borderRadius: "10px", borderColor: "#DCE7F3", background: "#F8FAFC" }} />
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>{sess.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={STATUS_STYLE[effStatus]}>{STATUS_LABEL[effStatus]}</span>
                        </div>
                      )}
                      {!isEditing && <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{formatDate(sess.startDateTime)} — {formatDate(sess.endDateTime)}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {isEditing ? (
                      <>
                        <button onClick={() => handleRename(sess.id)} disabled={!!saving} className="text-white text-xs font-semibold px-3 transition-all" style={{ height: "32px", borderRadius: "8px", background: "#3B82F6" }}>שמור</button>
                        <button onClick={() => setEditId(null)} className="text-xs font-medium px-3 border transition-all" style={{ height: "32px", borderRadius: "8px", borderColor: "#DCE7F3", color: "#64748B" }}>ביטול</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => router.push(`/admin/summary?sectionId=${sess.id}`)} className="text-white text-xs font-semibold px-3 transition-all" style={{ height: "32px", borderRadius: "8px", background: "#1E293B" }}>צפה בסיכום</button>
                        <button onClick={() => openPdfModal(sess)} className="text-xs font-semibold px-3 transition-all" style={{ height: "32px", borderRadius: "8px", background: "#F1F5F9", color: "#475569", border: "1px solid #DCE7F3" }}>PDF ⬇</button>
                        {effStatus === "open" && (
                          <button onClick={() => router.push("/order")} className="text-white text-xs font-semibold px-3 transition-all" style={{ height: "32px", borderRadius: "8px", background: "#3B82F6" }}>הגש בקשה</button>
                        )}
                        {(effStatus === "open" || effStatus === "pending") && envId && (
                          <button
                            onClick={() => handleShare(sess)}
                            className="text-xs font-semibold px-3 transition-all"
                            style={{ height: "32px", borderRadius: "8px", background: shareMsg === sess.id ? "#F0FDF4" : "#F8FAFC", color: shareMsg === sess.id ? "#15803D" : "#3B82F6", border: `1px solid ${shareMsg === sess.id ? "#BBF7D0" : "#BFDBFE"}` }}
                          >
                            {shareMsg === sess.id ? "✓ הועתק" : "🔗 שתף סשן"}
                          </button>
                        )}
                        {(effStatus === "open" || effStatus === "pending") && (
                          <button onClick={() => handleClose(sess.id)} disabled={isSaving} className="text-xs font-medium px-3 border transition-all" style={{ height: "32px", borderRadius: "8px", borderColor: "#FED7AA", color: "#C2410C", background: "#FFF7ED" }}>
                            {saving === sess.id + "_close" ? "..." : "בטל סשן"}
                          </button>
                        )}
                        <button onClick={() => { setEditId(sess.id); setEditName(sess.name); }} className="text-xs font-medium px-3 border transition-all" style={{ height: "32px", borderRadius: "8px", borderColor: "#DCE7F3", color: "#64748B", background: "#F8FAFC" }}>שנה שם</button>
                        {(effStatus === "expired" || effStatus === "closed") && (
                          <button onClick={() => handleDelete(sess.id, sess.name)} disabled={isSaving} className="text-xs font-medium px-3 border transition-all" style={{ height: "32px", borderRadius: "8px", borderColor: "#FECACA", color: "#EF4444", background: "#FFF1F1" }}>
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

      {/* PDF Modal */}
      {pdfModalOpen && pdfSession && (
        <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "rgba(15,23,42,0.55)" }}>
          <div className="flex-1" onClick={() => setPdfModalOpen(false)} />
          <div className="rounded-t-[24px]" style={{ background: "#FFFFFF", maxHeight: "88vh", overflowY: "auto" }}>
            {/* Modal header */}
            <div className="px-4 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>ייצוא PDF</h2>
                <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>{pdfSession.name}</p>
              </div>
              <button
                onClick={() => setPdfModalOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full text-sm"
                style={{ background: "#F1F5F9", color: "#64748B" }}
              >
                ✕
              </button>
            </div>

            <div className="px-4 py-4 space-y-5">
              {/* Header fields */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#94A3B8" }}>פרטי כותרת (אופציונלי)</p>
                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={headerOrg}
                    onChange={(e) => setHeaderOrg(e.target.value)}
                    placeholder="שם הארגון / גוף מבקש"
                    style={INPUT_STYLE}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={headerDate}
                      onChange={(e) => setHeaderDate(e.target.value)}
                      placeholder="תאריך"
                      style={INPUT_STYLE}
                    />
                    <input
                      type="text"
                      value={headerRef}
                      onChange={(e) => setHeaderRef(e.target.value)}
                      placeholder="מס׳ הזמנה"
                      style={INPUT_STYLE}
                    />
                  </div>
                  <textarea
                    value={headerNotes}
                    onChange={(e) => setHeaderNotes(e.target.value)}
                    placeholder="הערות כלליות..."
                    rows={2}
                    style={{ ...INPUT_STYLE, height: "auto", padding: "10px 12px", resize: "none" }}
                  />
                </div>
              </div>

              {/* Table selection */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#94A3B8" }}>תוכן הייצוא</p>
                <div className="space-y-2">
                  <label
                    className="flex items-center gap-3 p-3.5 rounded-[14px] cursor-pointer transition-colors"
                    style={{ border: `1px solid ${showSummaryTable ? "#BFDBFE" : "#DCE7F3"}`, background: showSummaryTable ? "#EFF6FF" : "#F8FAFC" }}
                  >
                    <input
                      type="checkbox"
                      checked={showSummaryTable}
                      onChange={(e) => setShowSummaryTable(e.target.checked)}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>טבלת סיכום</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>סה״כ כמות לכל פריט · {pdfSummary.length} שורות</p>
                    </div>
                  </label>
                  <label
                    className="flex items-center gap-3 p-3.5 rounded-[14px] cursor-pointer transition-colors"
                    style={{ border: `1px solid ${showDetailsTable ? "#BFDBFE" : "#DCE7F3"}`, background: showDetailsTable ? "#EFF6FF" : "#F8FAFC" }}
                  >
                    <input
                      type="checkbox"
                      checked={showDetailsTable}
                      onChange={(e) => setShowDetailsTable(e.target.checked)}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>טבלה מפורטת</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>פירוט הזמנות לפי משתמש · {activeDetails.length} שורות</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Export button */}
              <button
                onClick={handleExportPDF}
                disabled={pdfLoading || pdfFetching || (!showSummaryTable && !showDetailsTable) || (pdfSummary.length === 0 && activeDetails.length === 0)}
                className="w-full text-white font-semibold text-sm transition-all"
                style={{
                  height: "50px", borderRadius: "14px",
                  background: (pdfLoading || pdfFetching || (!showSummaryTable && !showDetailsTable) || (pdfSummary.length === 0 && activeDetails.length === 0)) ? "#94A3B8" : "#1E293B",
                }}
              >
                {pdfFetching ? "טוען נתונים..." : pdfLoading ? "מייצא PDF..." : (pdfSummary.length === 0 && activeDetails.length === 0) ? "אין הזמנות לייצוא" : "ייצא PDF ⬇"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF content */}
      <div className="fixed top-[-9999px] left-[-9999px] w-[1100px]" aria-hidden="true">
        <div ref={pdfRef} style={{ fontFamily: "Arial, sans-serif", direction: "rtl", padding: "24px", background: "white" }}>
          {/* Header section — only renders if there's any content */}
          <div style={{ marginBottom: "20px", borderBottom: "2px solid #1d4ed8", paddingBottom: "14px" }}>
            {hasHeader ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                <div>
                  {headerOrg && (
                    <h1 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e3a5f", margin: "0 0 4px 0" }}>{headerOrg}</h1>
                  )}
                  <p style={{ fontSize: "13px", color: "#3B82F6", margin: 0 }}>
                    סשן: {pdfSession?.name} · {pdfSession ? formatDateShort(pdfSession.startDateTime) : ""} — {pdfSession ? formatDateShort(pdfSession.endDateTime) : ""}
                  </p>
                  {headerNotes && (
                    <p style={{ fontSize: "12px", color: "#4B5563", margin: "6px 0 0 0" }}>הערות: {headerNotes}</p>
                  )}
                </div>
                <div style={{ textAlign: "left", fontSize: "12px", color: "#374151", flexShrink: 0 }}>
                  {headerDate && <p style={{ margin: "0 0 2px 0" }}>תאריך: {headerDate}</p>}
                  {headerRef && <p style={{ margin: 0 }}>מס׳ הזמנה: {headerRef}</p>}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: "13px", color: "#3B82F6", margin: 0 }}>
                סשן: {pdfSession?.name} · {pdfSession ? formatDateShort(pdfSession.startDateTime) : ""} — {pdfSession ? formatDateShort(pdfSession.endDateTime) : ""}
              </p>
            )}
          </div>

          {/* Summary table */}
          {showSummaryTable && pdfSummary.length > 0 && (
            <>
              <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#1e3a5f", margin: "0 0 8px 0" }}>
                סיכום כמויות · {totalQty} יחידות
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "28px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#1d4ed8", color: "white" }}>
                    <th style={{ padding: "6px 10px", textAlign: "right", border: "1px solid #1d4ed8" }}>פריט</th>
                    <th style={{ padding: "6px 10px", textAlign: "center", border: "1px solid #1d4ed8", width: "80px" }}>סך כמות</th>
                    <th style={{ padding: "6px 10px", textAlign: "right", border: "1px solid #1d4ed8" }}>הערות</th>
                  </tr>
                </thead>
                <tbody>
                  {pdfSummary.map((row, i) => (
                    <tr key={row.itemId} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                      <td style={{ padding: "5px 10px", border: "1px solid #e2e8f0" }}>{row.itemName}</td>
                      <td style={{ padding: "5px 10px", textAlign: "center", fontWeight: "bold", color: "#1d4ed8", border: "1px solid #e2e8f0" }}>{row.total}</td>
                      <td style={{ padding: "5px 10px", color: "#6b7280", fontSize: "10px", border: "1px solid #e2e8f0" }}>{row.notes || ""}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: "#dbeafe" }}>
                    <td style={{ padding: "6px 10px", fontWeight: "bold", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>סה״כ</td>
                    <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: "bold", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>{totalQty}</td>
                    <td style={{ border: "1px solid #bfdbfe" }} />
                  </tr>
                </tbody>
              </table>
            </>
          )}

          {/* Details table */}
          {showDetailsTable && activeDetails.length > 0 && (
            <>
              <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#1e3a5f", margin: "0 0 8px 0" }}>טבלה מפורטת</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#374151", color: "white" }}>
                    {["שם מלא", "מייל", "טלפון", "פריט", "כמות", "הערות"].map((h) => (
                      <th key={h} style={{ padding: "5px 8px", textAlign: "right", border: "1px solid #374151" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeDetails.map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                      <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0", fontWeight: 500 }}>{row.userFullName}</td>
                      <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0" }}>{row.email}</td>
                      <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0" }}>{row.phoneNumber}</td>
                      <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0" }}>{row.itemName}</td>
                      <td style={{ padding: "4px 8px", textAlign: "center", fontWeight: "bold", color: "#1d4ed8", border: "1px solid #e2e8f0" }}>{row.quantity}</td>
                      <td style={{ padding: "4px 8px", color: "#6b7280", border: "1px solid #e2e8f0" }}>{row.note || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      <BottomNav isAdmin pendingCount={pendingCount > 0 ? pendingCount : undefined} />
    </div>
  );
}
