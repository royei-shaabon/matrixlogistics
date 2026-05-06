"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";

interface SummaryRow {
  itemId: number;
  itemName: string;
  total: number;
  notes: string;
}

interface DetailRow {
  itemDocId: string;
  userId: string;
  userFullName: string;
  email: string;
  branch: string;
  department: string;
  itemName: string;
  quantity: number;
  orderNote: string;
  status: "active" | "blocked";
}

interface UserOrder {
  userId: string;
  userFullName: string;
  email: string;
  branch: string;
  department: string;
  items: { itemDocId: string; itemName: string; quantity: number; orderNote: string; status: "active" | "blocked" }[];
}

interface Session {
  id: string;
  name: string;
  windowId: string;
  status: "open" | "closed";
  startDateTime: string;
  endDateTime: string;
}

const DEPT_COLORS = [
  "#fef9c3", "#dbeafe", "#dcfce7", "#fce7f3", "#ede9fe",
  "#ffedd5", "#cffafe", "#f0fdf4", "#fdf2f8", "#fffbeb",
];

function getDeptColor(dept: string): string {
  let hash = 0;
  for (let i = 0; i < dept.length; i++) hash = (hash * 31 + dept.charCodeAt(i)) & 0xfffff;
  return DEPT_COLORS[hash % DEPT_COLORS.length];
}

function groupByUser(details: DetailRow[]): UserOrder[] {
  const map = new Map<string, UserOrder>();
  for (const row of details) {
    if (!map.has(row.userId)) {
      map.set(row.userId, {
        userId: row.userId, userFullName: row.userFullName,
        email: row.email, branch: row.branch, department: row.department, items: [],
      });
    }
    map.get(row.userId)!.items.push({
      itemDocId: row.itemDocId,
      itemName: row.itemName,
      quantity: row.quantity,
      orderNote: row.orderNote,
      status: row.status,
    });
  }
  return Array.from(map.values()).sort((a, b) => a.userFullName.localeCompare(b.userFullName, "he"));
}

function getEffectiveStatus(sess: Session): "pending" | "open" | "expired" | "closed" {
  if (sess.status === "closed") return "closed";
  const now = Date.now();
  if (now < new Date(sess.startDateTime).getTime()) return "pending";
  if (now > new Date(sess.endDateTime).getTime()) return "expired";
  return "open";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function SummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [details, setDetails] = useState<DetailRow[]>([]);
  const [orderDetails, setOrderDetails] = useState<Record<string, string>>({});
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "details">("summary");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [savingItem, setSavingItem] = useState<string | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async (windowId: string | null) => {
    setLoading(true);
    const qs = windowId ? `?windowId=${windowId}` : "";
    const [s, d, od] = await Promise.all([
      fetch(`/api/admin/summary${qs}`).then((r) => r.json()),
      fetch(`/api/admin/details${qs}`).then((r) => r.json()),
      fetch("/api/admin/order-details").then((r) => r.json()),
    ]);
    setSummary(s.summary || []);
    setDetails(d.details || []);
    setOrderDetails(od.details || {});
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user || d.user.role !== "admin") router.push("/login");
    });
    fetch("/api/admin/sessions").then((r) => r.json()).then((data) => {
      const list: Session[] = data.sessions || [];
      setSessions(list);

      // Determine which session to show: from URL param, then first session
      const urlWindowId = searchParams.get("windowId");
      let chosen: Session | null = null;
      if (urlWindowId) {
        chosen = list.find((s) => s.windowId === urlWindowId) || null;
      }
      if (!chosen && list.length > 0) chosen = list[0];

      if (chosen) {
        setSelectedWindowId(chosen.windowId);
        setSelectedSession(chosen);
        loadData(chosen.windowId);
      } else {
        loadData(null);
      }
    });
  }, [router, loadData, searchParams]);

  async function handleSelectSession(sess: Session) {
    setSelectedWindowId(sess.windowId);
    setSelectedSession(sess);
    setExpanded(new Set());
    await loadData(sess.windowId);
  }

  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`למחוק את כל ההזמנה של ${userName}?`)) return;
    setDeleting(userId);
    const res = await fetch(`/api/orders/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setExpanded((prev) => { const next = new Set(prev); next.delete(userId); return next; });
      await loadData(selectedWindowId);
    } else {
      alert("שגיאה במחיקה");
    }
    setDeleting(null);
  }

  async function handleSaveQty(itemDocId: string) {
    if (editQty <= 0) return;
    setSavingItem(itemDocId);
    await fetch(`/api/admin/order-items/${itemDocId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: editQty }),
    });
    setDetails((prev) =>
      prev.map((item) => item.itemDocId === itemDocId ? { ...item, quantity: editQty } : item)
    );
    const qs = selectedWindowId ? `?windowId=${selectedWindowId}` : "";
    const s = await fetch(`/api/admin/summary${qs}`).then((r) => r.json());
    setSummary(s.summary || []);
    setSavingItem(null);
    setEditingItem(null);
  }

  async function handleDeleteItem(itemDocId: string, userId: string) {
    setSavingItem(itemDocId);
    await fetch(`/api/admin/order-items/${itemDocId}`, { method: "DELETE" });
    setDetails((prev) => prev.filter((item) => item.itemDocId !== itemDocId));
    const qs = selectedWindowId ? `?windowId=${selectedWindowId}` : "";
    const s = await fetch(`/api/admin/summary${qs}`).then((r) => r.json());
    setSummary(s.summary || []);
    // Collapse if user has no more items
    setDetails((prev) => {
      const remaining = prev.filter((d) => d.userId === userId);
      if (remaining.length === 0) setExpanded((e) => { const n = new Set(e); n.delete(userId); return n; });
      return prev;
    });
    setSavingItem(null);
  }

  async function handleExportPDF() {
    setPdfLoading(true);
    try {
      const html2pdf = (await import("html2pdf.js" as string)).default;
      const element = pdfRef.current;
      if (!element) return;
      const sessionName = selectedSession?.name || "";
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `הזמנת-אספקה${sessionName ? "-" + sessionName : ""}-${new Date().toLocaleDateString("he-IL").replace(/\//g, "-")}.pdf`,
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };
      await html2pdf().set(opt).from(element).save();
    } finally {
      setPdfLoading(false);
    }
  }

  function toggleExpand(userId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  const userOrders = groupByUser(details);
  const departments = [...new Set(userOrders.map((u) => u.department))];
  const deptUserCount: Record<string, number> = {};
  for (const u of userOrders) deptUserCount[u.department] = (deptUserCount[u.department] || 0) + 1;
  const totalQty = summary.reduce((acc, r) => acc + r.total, 0);
  const activeDetails = details.filter((d) => d.status !== "blocked");

  return (
    <div className="min-h-screen" style={{ background: "#F9FBFD", paddingBottom: "90px" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>סיכום הזמנות</h1>
          {!loading && selectedSession && (
            <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
              {selectedSession.name} · {userOrders.length} משתמשים · {totalQty} יחידות
            </p>
          )}
        </div>
        <button
          onClick={handleExportPDF}
          disabled={pdfLoading || summary.length === 0}
          className="text-sm font-semibold px-4 transition-all print:hidden"
          style={{ height: "40px", borderRadius: "12px", background: "#1E293B", color: "#FFFFFF", opacity: (pdfLoading || summary.length === 0) ? 0.4 : 1 }}
        >
          {pdfLoading ? "..." : "PDF ⬇"}
        </button>
      </div>

      <div className="px-4 space-y-3">
        {/* Session picker */}
        {sessions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 print:hidden" style={{ scrollbarWidth: "none" }}>
            {sessions.map((sess) => {
              const isSelected = selectedWindowId === sess.windowId;
              return (
                <button
                  key={sess.id}
                  onClick={() => handleSelectSession(sess)}
                  className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5"
                  style={{
                    background: isSelected ? "#1E293B" : "#FFFFFF",
                    color: isSelected ? "#FFFFFF" : "#64748B",
                    border: `1px solid ${isSelected ? "#1E293B" : "#DCE7F3"}`,
                  }}
                >
                  {sess.name}
                  {getEffectiveStatus(sess) === "open" && (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isSelected ? "rgba(255,255,255,0.7)" : "#22C55E" }} />
                  )}
                  {getEffectiveStatus(sess) === "pending" && (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isSelected ? "rgba(255,255,255,0.7)" : "#F59E0B" }} />
                  )}
                  <span className="text-[10px]" style={{ opacity: 0.7 }}>{formatDate(sess.startDateTime)}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Department legend */}
        {departments.length > 1 && (
          <div className="flex flex-wrap gap-2 print:hidden">
            {departments.map((dept) => (
              <span
                key={dept}
                className="text-xs px-3 py-1 rounded-full border font-medium inline-flex items-center gap-1.5"
                style={{ backgroundColor: getDeptColor(dept), borderColor: "rgba(0,0,0,0.08)", color: "#1E293B" }}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: getDeptColor(dept), border: "1.5px solid rgba(0,0,0,0.2)" }}
                />
                {dept}
                {deptUserCount[dept] > 1 && (
                  <span className="text-[10px] font-bold px-1 rounded" style={{ background: "#F59E0B", color: "#FFFFFF" }}>
                    {deptUserCount[dept]}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 print:hidden">
          {(["summary", "details"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: activeTab === tab ? "#3B82F6" : "#FFFFFF",
                color: activeTab === tab ? "#FFFFFF" : "#64748B",
                border: `1px solid ${activeTab === tab ? "#3B82F6" : "#DCE7F3"}`,
              }}
            >
              {tab === "summary" ? "סיכום כמויות" : `לפי משתמש (${userOrders.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16" style={{ color: "#94A3B8" }}>טוען...</div>
        ) : (
          <>
            {/* Summary tab */}
            <div className={activeTab === "summary" ? "" : "hidden"}>
              {summary.length === 0 ? (
                <div
                  className="rounded-[18px] p-10 text-center text-sm"
                  style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", color: "#94A3B8" }}
                >
                  {sessions.length === 0 ? "אין סשנים — פתח סשן מדף הסשנים" : "אין הזמנות בסשן זה"}
                </div>
              ) : (
                <div className="space-y-2">
                  {summary.map((row) => (
                    <div
                      key={row.itemId}
                      className="rounded-[18px] px-4 py-3 flex items-center justify-between gap-3"
                      style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}
                    >
                      <span className="text-sm font-medium flex-1" style={{ color: "#1E293B" }}>{row.itemName}</span>
                      {row.notes && (
                        <span className="text-xs truncate max-w-[100px]" style={{ color: "#94A3B8" }}>{row.notes}</span>
                      )}
                      <span className="text-base font-bold flex-shrink-0 min-w-[36px] text-center" style={{ color: "#3B82F6" }}>
                        {row.total}
                      </span>
                    </div>
                  ))}
                  <div
                    className="rounded-[18px] px-4 py-3 flex items-center justify-between"
                    style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
                  >
                    <span className="text-sm font-bold" style={{ color: "#1D4ED8" }}>סה״כ</span>
                    <span className="text-lg font-bold" style={{ color: "#1D4ED8" }}>{totalQty}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Details tab */}
            <div className={activeTab === "details" ? "" : "hidden"}>
              {userOrders.length === 0 ? (
                <div
                  className="rounded-[18px] p-10 text-center text-sm"
                  style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", color: "#94A3B8" }}
                >
                  אין הזמנות בסשן זה
                </div>
              ) : (
                <div className="space-y-2">
                  {userOrders.map((user) => {
                    const isOpen = expanded.has(user.userId);
                    const deptColor = getDeptColor(user.department);
                    const isDuplDept = deptUserCount[user.department] > 1;
                    const activeItemCount = user.items.filter((i) => i.status === "active").length;

                    return (
                      <div key={user.userId}>
                        <div
                          className="rounded-[18px] overflow-hidden"
                          style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleExpand(user.userId)}
                            onKeyDown={(e) => e.key === "Enter" && toggleExpand(user.userId)}
                            className="px-4 py-3.5 flex items-center gap-3 cursor-pointer"
                            style={{ background: isOpen ? deptColor : undefined }}
                          >
                            <span className="text-sm" style={{ color: "#94A3B8" }}>{isOpen ? "▾" : "▸"}</span>
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: deptColor, border: "1.5px solid rgba(0,0,0,0.15)" }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate" style={{ color: "#1E293B" }}>{user.userFullName}</span>
                                {isDuplDept && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "#FEF3C7", color: "#92400E" }}>כפול</span>
                                )}
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{user.branch} · {user.department}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                                {activeItemCount}/{user.items.length}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(user.userId, user.userFullName); }}
                                disabled={deleting === user.userId}
                                className="text-xs px-2.5 py-1 rounded-lg border transition-colors"
                                style={{ color: "#EF4444", borderColor: "#FECACA", background: "transparent", opacity: deleting === user.userId ? 0.4 : 1 }}
                              >
                                {deleting === user.userId ? "..." : "מחק"}
                              </button>
                            </div>
                          </div>

                          {isOpen && (
                            <div style={{ background: deptColor, borderTop: "1px solid rgba(255,255,255,0.6)" }}>
                              {user.items.map((item, idx) => {
                                const isEditing = editingItem === item.itemDocId;
                                const isSaving = savingItem === item.itemDocId;
                                return (
                                  <div
                                    key={item.itemDocId}
                                    className="px-4 py-2.5 flex items-center gap-2"
                                    style={{ borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.5)" : undefined }}
                                  >
                                    <span className="text-sm flex-1 min-w-0 truncate" style={{ color: "#374151" }}>
                                      {item.itemName}
                                      {item.orderNote && <span className="text-xs mr-1" style={{ color: "#6B7280" }}>({item.orderNote})</span>}
                                    </span>
                                    {isEditing ? (
                                      <>
                                        <div className="flex items-center rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid #DCE7F3", background: "#fff" }}>
                                          <button
                                            onClick={() => setEditQty((q) => Math.max(1, q - 1))}
                                            className="flex items-center justify-center text-base"
                                            style={{ width: "30px", height: "30px", color: "#64748B" }}
                                          >−</button>
                                          <span className="text-sm font-bold text-center" style={{ width: "28px", color: "#1D4ED8" }}>{editQty}</span>
                                          <button
                                            onClick={() => setEditQty((q) => q + 1)}
                                            className="flex items-center justify-center text-base"
                                            style={{ width: "30px", height: "30px", color: "#3B82F6" }}
                                          >+</button>
                                        </div>
                                        <button
                                          onClick={() => handleSaveQty(item.itemDocId)}
                                          disabled={isSaving}
                                          className="text-[11px] font-semibold px-2 py-0.5 rounded-lg flex-shrink-0"
                                          style={{ background: "#3B82F6", color: "#fff", opacity: isSaving ? 0.5 : 1 }}
                                        >{isSaving ? "..." : "שמור"}</button>
                                        <button
                                          onClick={() => setEditingItem(null)}
                                          className="text-[11px] font-medium px-2 py-0.5 rounded-lg border flex-shrink-0"
                                          style={{ borderColor: "#DCE7F3", color: "#64748B" }}
                                        >ביטול</button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="font-bold text-sm flex-shrink-0" style={{ color: "#1D4ED8" }}>{item.quantity}</span>
                                        <button
                                          onClick={() => { setEditingItem(item.itemDocId); setEditQty(item.quantity); }}
                                          className="text-[11px] font-medium px-2 py-0.5 rounded-lg border flex-shrink-0"
                                          style={{ borderColor: "#BFDBFE", color: "#1D4ED8", background: "#EFF6FF" }}
                                        >ערוך</button>
                                        <button
                                          onClick={() => handleDeleteItem(item.itemDocId, user.userId)}
                                          disabled={isSaving}
                                          className="text-[11px] font-medium px-2 py-0.5 rounded-lg border flex-shrink-0"
                                          style={{ borderColor: "#FECACA", color: "#EF4444", background: "#FFF1F1", opacity: isSaving ? 0.5 : 1 }}
                                        >{isSaving ? "..." : "מחק"}</button>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Hidden PDF template */}
      <div className="fixed top-[-9999px] left-[-9999px] w-[1100px]" aria-hidden="true">
        <div ref={pdfRef} style={{ fontFamily: "Arial, sans-serif", direction: "rtl", padding: "20px", background: "white" }}>
          <div style={{ marginBottom: "20px", borderBottom: "2px solid #1d4ed8", paddingBottom: "12px" }}>
            <h1 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e3a5f", margin: "0 0 4px 0" }}>
              סל מוצרי מזון לאספקה לעובדי מטריקס באתרים
            </h1>
            {selectedSession && (
              <p style={{ fontSize: "13px", color: "#3B82F6", margin: "0 0 10px 0" }}>
                סשן: {selectedSession.name} · {formatDate(selectedSession.startDateTime)} — {formatDate(selectedSession.endDateTime)}
              </p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", fontSize: "12px", color: "#374151" }}>
              <div><strong>תאריך הזמנה:</strong> {orderDetails.orderDate || "—"}</div>
              <div><strong>המזמין:</strong> {orderDetails.requesterName || "—"}</div>
              <div><strong>מס׳ נייד:</strong> {orderDetails.phoneNumber || "—"}</div>
              <div><strong>מס׳ עובדים באתר:</strong> {orderDetails.matrixEmployeesCount || "—"}</div>
              <div><strong>אתר לקוח:</strong> שלישות רמת גן</div>
              <div><strong>כתובת לאספקה:</strong> בן גוריון 100, רמת גן</div>
              <div style={{ gridColumn: "1 / -1" }}><strong>הערות לשליח:</strong> {orderDetails.courierNotes || "נא להתקשר חצי שעה לפני הגעה"}</div>
            </div>
          </div>

          <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#1e3a5f", marginBottom: "8px" }}>סיכום כמויות</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "24px" }}>
            <thead>
              <tr style={{ backgroundColor: "#1d4ed8", color: "white" }}>
                <th style={{ padding: "6px 10px", textAlign: "right", border: "1px solid #1d4ed8" }}>פריט</th>
                <th style={{ padding: "6px 10px", textAlign: "center", border: "1px solid #1d4ed8", width: "80px" }}>סך כמות</th>
                <th style={{ padding: "6px 10px", textAlign: "right", border: "1px solid #1d4ed8" }}>הערות</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row, i) => (
                <tr key={row.itemId} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                  <td style={{ padding: "5px 10px", border: "1px solid #e2e8f0" }}>{row.itemName}</td>
                  <td style={{ padding: "5px 10px", textAlign: "center", fontWeight: "bold", color: "#1d4ed8", border: "1px solid #e2e8f0" }}>{row.total}</td>
                  <td style={{ padding: "5px 10px", color: "#6b7280", fontSize: "10px", border: "1px solid #e2e8f0" }}>{row.notes || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#1e3a5f", marginBottom: "8px" }}>טבלה מפורטת</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <thead>
              <tr style={{ backgroundColor: "#374151", color: "white" }}>
                {["שם מלא", "מייל", "ענף", "מדור", "פריט", "כמות", "הערות"].map((h) => (
                  <th key={h} style={{ padding: "5px 8px", textAlign: "right", border: "1px solid #374151" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeDetails.map((row, i) => (
                <tr key={i} style={{ backgroundColor: getDeptColor(row.department) }}>
                  <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0", fontWeight: 500 }}>{row.userFullName}</td>
                  <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0" }}>{row.email}</td>
                  <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0" }}>{row.branch}</td>
                  <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0" }}>{row.department}</td>
                  <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0" }}>{row.itemName}</td>
                  <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0", textAlign: "center", fontWeight: "bold", color: "#1d4ed8" }}>{row.quantity}</td>
                  <td style={{ padding: "4px 8px", border: "1px solid #e2e8f0", color: "#6b7280" }}>{row.orderNote || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BottomNav isAdmin />
    </div>
  );
}
