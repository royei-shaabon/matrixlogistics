"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";

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

interface UserOrder {
  userId: string;
  userFullName: string;
  email: string;
  phoneNumber: string;
  items: { itemDocId: string; itemName: string; quantity: number; note: string; status: "active" | "blocked" }[];
}

interface Section {
  id: string;
  name: string;
  status: "open" | "closed";
  startDateTime: string;
  endDateTime: string;
}

function groupByUser(details: DetailRow[]): UserOrder[] {
  const map = new Map<string, UserOrder>();
  for (const row of details) {
    if (!map.has(row.userId)) {
      map.set(row.userId, { userId: row.userId, userFullName: row.userFullName, email: row.email, phoneNumber: row.phoneNumber, items: [] });
    }
    map.get(row.userId)!.items.push({ itemDocId: row.itemDocId, itemName: row.itemName, quantity: row.quantity, note: row.note, status: row.status });
  }
  return Array.from(map.values()).sort((a, b) => a.userFullName.localeCompare(b.userFullName, "he"));
}

function getEffectiveStatus(sess: Section): "pending" | "open" | "expired" | "closed" {
  if (sess.status === "closed") return "closed";
  const now = Date.now();
  if (now < new Date(sess.startDateTime).getTime()) return "pending";
  if (now > new Date(sess.endDateTime).getTime()) return "expired";
  return "open";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function SummaryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [details, setDetails] = useState<DetailRow[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "details">("summary");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [showSummaryTable, setShowSummaryTable] = useState(true);
  const [showDetailsTable, setShowDetailsTable] = useState(true);
  const [headerOrg, setHeaderOrg] = useState("");
  const [headerDate, setHeaderDate] = useState("");
  const [headerRef2, setHeaderRef2] = useState("");
  const [headerNotes, setHeaderNotes] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [savingItem, setSavingItem] = useState<string | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async (sectionId: string | null) => {
    setLoading(true);
    const qs = sectionId ? `?sectionId=${sectionId}` : "";
    const [s, d] = await Promise.all([
      fetch(`/api/admin/summary${qs}`).then((r) => r.json()),
      fetch(`/api/admin/details${qs}`).then((r) => r.json()),
    ]);
    setSummary(s.summary || []);
    setDetails(d.details || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user) { router.push("/login"); return; }
      const isAdmin = d.user.globalRole === "super_admin" || d.user.environmentRole === "environment_admin";
      if (!isAdmin) { router.push("/order"); return; }
    });
    fetch("/api/admin/sessions").then((r) => r.json()).then((data) => {
      const list: Section[] = data.sessions || [];
      setSections(list);
      const urlSectionId = searchParams.get("sectionId");
      let chosen: Section | null = null;
      if (urlSectionId) chosen = list.find((s) => s.id === urlSectionId) || null;
      if (!chosen && list.length > 0) chosen = list[0];
      if (chosen) {
        setSelectedSectionId(chosen.id);
        setSelectedSection(chosen);
        loadData(chosen.id);
      } else {
        loadData(null);
      }
    });
  }, [router, loadData, searchParams]);

  async function handleSelectSection(sess: Section) {
    setSelectedSectionId(sess.id);
    setSelectedSection(sess);
    setExpanded(new Set());
    await loadData(sess.id);
  }

  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`למחוק את כל ההזמנה של ${userName}?`)) return;
    setDeleting(userId);
    const res = await fetch(`/api/orders/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setExpanded((prev) => { const next = new Set(prev); next.delete(userId); return next; });
      await loadData(selectedSectionId);
    } else {
      alert("שגיאה במחיקה");
    }
    setDeleting(null);
  }

  async function handleSaveQty(itemDocId: string) {
    if (editQty <= 0) return;
    setSavingItem(itemDocId);
    await fetch(`/api/admin/order-items/${itemDocId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: editQty }) });
    setDetails((prev) => prev.map((item) => item.itemDocId === itemDocId ? { ...item, quantity: editQty } : item));
    const qs = selectedSectionId ? `?sectionId=${selectedSectionId}` : "";
    const s = await fetch(`/api/admin/summary${qs}`).then((r) => r.json());
    setSummary(s.summary || []);
    setSavingItem(null);
    setEditingItem(null);
  }

  async function handleDeleteItem(itemDocId: string, userId: string) {
    setSavingItem(itemDocId);
    await fetch(`/api/admin/order-items/${itemDocId}`, { method: "DELETE" });
    setDetails((prev) => prev.filter((item) => item.itemDocId !== itemDocId));
    const qs = selectedSectionId ? `?sectionId=${selectedSectionId}` : "";
    const s = await fetch(`/api/admin/summary${qs}`).then((r) => r.json());
    setSummary(s.summary || []);
    setDetails((prev) => {
      const remaining = prev.filter((d) => d.userId === userId);
      if (remaining.length === 0) setExpanded((e) => { const n = new Set(e); n.delete(userId); return n; });
      return prev;
    });
    setSavingItem(null);
  }

  function openPdfModal() {
    setHeaderOrg("");
    setHeaderDate(new Date().toLocaleDateString("he-IL"));
    setHeaderRef2("");
    setHeaderNotes("");
    setShowSummaryTable(true);
    setShowDetailsTable(true);
    setPdfModalOpen(true);
  }

  async function handleExportPDF() {
    if (!pdfRef.current) return;
    setPdfLoading(true);
    try {
      const html2pdf = (await import("html2pdf.js" as string)).default;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `הזמנת-אספקה-${selectedSection?.name || ""}-${new Date().toLocaleDateString("he-IL").replace(/\//g, "-")}.pdf`,
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };
      await html2pdf().set(opt).from(pdfRef.current).save();
    } finally {
      setPdfLoading(false);
    }
  }

  function toggleExpand(userId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  }

  const userOrders = groupByUser(details);
  const totalQty = summary.reduce((acc, r) => acc + r.total, 0);
  const activeDetails = details.filter((d) => d.status !== "blocked");

  return (
    <div className="min-h-screen" style={{ background: "#F9FBFD", paddingBottom: "90px" }}>
      <div className="px-4 pt-6 pb-4 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>סיכום הזמנות</h1>
          {!loading && selectedSection && (
            <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
              {selectedSection.name} · {userOrders.length} משתמשים · {totalQty} יחידות
            </p>
          )}
        </div>
        <button
          onClick={openPdfModal}
          disabled={summary.length === 0}
          className="text-sm font-semibold px-4 transition-all print:hidden"
          style={{ height: "40px", borderRadius: "12px", background: "#1E293B", color: "#FFFFFF", opacity: summary.length === 0 ? 0.4 : 1 }}
        >
          PDF ⬇
        </button>
      </div>

      <div className="px-4 space-y-3">
        {sections.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 print:hidden" style={{ scrollbarWidth: "none" }}>
            {sections.map((sess) => {
              const isSelected = selectedSectionId === sess.id;
              return (
                <button
                  key={sess.id}
                  onClick={() => handleSelectSection(sess)}
                  className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5"
                  style={{ background: isSelected ? "#1E293B" : "#FFFFFF", color: isSelected ? "#FFFFFF" : "#64748B", border: `1px solid ${isSelected ? "#1E293B" : "#DCE7F3"}` }}
                >
                  {sess.name}
                  {getEffectiveStatus(sess) === "open" && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isSelected ? "rgba(255,255,255,0.7)" : "#22C55E" }} />}
                  <span className="text-[10px]" style={{ opacity: 0.7 }}>{formatDate(sess.startDateTime)}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-2 print:hidden">
          {(["summary", "details"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{ background: activeTab === tab ? "#3B82F6" : "#FFFFFF", color: activeTab === tab ? "#FFFFFF" : "#64748B", border: `1px solid ${activeTab === tab ? "#3B82F6" : "#DCE7F3"}` }}
            >
              {tab === "summary" ? "סיכום כמויות" : `לפי משתמש (${userOrders.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16" style={{ color: "#94A3B8" }}>טוען...</div>
        ) : (
          <>
            <div className={activeTab === "summary" ? "" : "hidden"}>
              {summary.length === 0 ? (
                <div className="rounded-[18px] p-10 text-center text-sm" style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", color: "#94A3B8" }}>
                  {sections.length === 0 ? "אין סשנים — פתח סשן מדף הסשנים" : "אין הזמנות בסשן זה"}
                </div>
              ) : (
                <div className="space-y-2">
                  {summary.map((row) => (
                    <div key={row.itemId} className="rounded-[18px] px-4 py-3 flex items-center justify-between gap-3" style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}>
                      <span className="text-sm font-medium flex-1" style={{ color: "#1E293B" }}>{row.itemName}</span>
                      {row.notes && <span className="text-xs truncate max-w-[100px]" style={{ color: "#94A3B8" }}>{row.notes}</span>}
                      <span className="text-base font-bold flex-shrink-0 min-w-[36px] text-center" style={{ color: "#3B82F6" }}>{row.total}</span>
                    </div>
                  ))}
                  <div className="rounded-[18px] px-4 py-3 flex items-center justify-between" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                    <span className="text-sm font-bold" style={{ color: "#1D4ED8" }}>סה״כ</span>
                    <span className="text-lg font-bold" style={{ color: "#1D4ED8" }}>{totalQty}</span>
                  </div>
                </div>
              )}
            </div>

            <div className={activeTab === "details" ? "" : "hidden"}>
              {userOrders.length === 0 ? (
                <div className="rounded-[18px] p-10 text-center text-sm" style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", color: "#94A3B8" }}>אין הזמנות בסשן זה</div>
              ) : (
                <div className="space-y-2">
                  {userOrders.map((user) => {
                    const isOpen = expanded.has(user.userId);
                    const activeItemCount = user.items.filter((i) => i.status === "active").length;
                    return (
                      <div key={user.userId} className="rounded-[18px] overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}>
                        <div role="button" tabIndex={0} onClick={() => toggleExpand(user.userId)} onKeyDown={(e) => e.key === "Enter" && toggleExpand(user.userId)} className="px-4 py-3.5 flex items-center gap-3 cursor-pointer" style={{ background: isOpen ? "#EFF6FF" : undefined }}>
                          <span className="text-sm" style={{ color: "#94A3B8" }}>{isOpen ? "▾" : "▸"}</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-sm truncate block" style={{ color: "#1E293B" }}>{user.userFullName}</span>
                            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{user.phoneNumber || user.email}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#DBEAFE", color: "#1D4ED8" }}>{activeItemCount}/{user.items.length}</span>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(user.userId, user.userFullName); }} disabled={deleting === user.userId} className="text-xs px-2.5 py-1 rounded-lg border transition-colors" style={{ color: "#EF4444", borderColor: "#FECACA", background: "transparent", opacity: deleting === user.userId ? 0.4 : 1 }}>
                              {deleting === user.userId ? "..." : "מחק"}
                            </button>
                          </div>
                        </div>
                        {isOpen && (
                          <div style={{ background: "#EFF6FF", borderTop: "1px solid rgba(255,255,255,0.6)" }}>
                            {user.items.map((item, idx) => {
                              const isEditing = editingItem === item.itemDocId;
                              const isSavingItem = savingItem === item.itemDocId;
                              return (
                                <div key={item.itemDocId} className="px-4 py-2.5 flex items-center gap-2" style={{ borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.5)" : undefined }}>
                                  <span className="text-sm flex-1 min-w-0 truncate" style={{ color: "#374151" }}>
                                    {item.itemName}
                                    {item.note && <span className="text-xs mr-1" style={{ color: "#6B7280" }}>({item.note})</span>}
                                  </span>
                                  {isEditing ? (
                                    <>
                                      <div className="flex items-center rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid #DCE7F3", background: "#fff" }}>
                                        <button onClick={() => setEditQty((q) => Math.max(1, q - 1))} className="flex items-center justify-center text-base" style={{ width: "30px", height: "30px", color: "#64748B" }}>−</button>
                                        <span className="text-sm font-bold text-center" style={{ width: "28px", color: "#1D4ED8" }}>{editQty}</span>
                                        <button onClick={() => setEditQty((q) => q + 1)} className="flex items-center justify-center text-base" style={{ width: "30px", height: "30px", color: "#3B82F6" }}>+</button>
                                      </div>
                                      <button onClick={() => handleSaveQty(item.itemDocId)} disabled={isSavingItem} className="text-[11px] font-semibold px-2 py-0.5 rounded-lg flex-shrink-0" style={{ background: "#3B82F6", color: "#fff", opacity: isSavingItem ? 0.5 : 1 }}>{isSavingItem ? "..." : "שמור"}</button>
                                      <button onClick={() => setEditingItem(null)} className="text-[11px] font-medium px-2 py-0.5 rounded-lg border flex-shrink-0" style={{ borderColor: "#DCE7F3", color: "#64748B" }}>ביטול</button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-bold text-sm flex-shrink-0" style={{ color: "#1D4ED8" }}>{item.quantity}</span>
                                      <button onClick={() => { setEditingItem(item.itemDocId); setEditQty(item.quantity); }} className="text-[11px] font-medium px-2 py-0.5 rounded-lg border flex-shrink-0" style={{ borderColor: "#BFDBFE", color: "#1D4ED8", background: "#EFF6FF" }}>ערוך</button>
                                      <button onClick={() => handleDeleteItem(item.itemDocId, user.userId)} disabled={isSavingItem} className="text-[11px] font-medium px-2 py-0.5 rounded-lg border flex-shrink-0" style={{ borderColor: "#FECACA", color: "#EF4444", background: "#FFF1F1", opacity: isSavingItem ? 0.5 : 1 }}>{isSavingItem ? "..." : "מחק"}</button>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* PDF Modal */}
      {pdfModalOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "rgba(15,23,42,0.55)" }}>
          <div className="flex-1" onClick={() => setPdfModalOpen(false)} />
          <div className="rounded-t-[24px]" style={{ background: "#FFFFFF", maxHeight: "88vh", overflowY: "auto" }}>
            <div className="px-4 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>ייצוא PDF</h2>
                {selectedSection && <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>{selectedSection.name}</p>}
              </div>
              <button onClick={() => setPdfModalOpen(false)} className="flex items-center justify-center w-8 h-8 rounded-full text-sm" style={{ background: "#F1F5F9", color: "#64748B" }}>✕</button>
            </div>
            <div className="px-4 py-4 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#94A3B8" }}>פרטי כותרת (אופציונלי)</p>
                <div className="space-y-2.5">
                  <input type="text" value={headerOrg} onChange={(e) => setHeaderOrg(e.target.value)} placeholder="שם הארגון / גוף מבקש" style={{ width: "100%", height: "44px", borderRadius: "12px", border: "1px solid #DCE7F3", background: "#F8FAFC", padding: "0 12px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={headerDate} onChange={(e) => setHeaderDate(e.target.value)} placeholder="תאריך" style={{ width: "100%", height: "44px", borderRadius: "12px", border: "1px solid #DCE7F3", background: "#F8FAFC", padding: "0 12px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                    <input type="text" value={headerRef2} onChange={(e) => setHeaderRef2(e.target.value)} placeholder="מס׳ הזמנה" style={{ width: "100%", height: "44px", borderRadius: "12px", border: "1px solid #DCE7F3", background: "#F8FAFC", padding: "0 12px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <textarea value={headerNotes} onChange={(e) => setHeaderNotes(e.target.value)} placeholder="הערות כלליות..." rows={2} style={{ width: "100%", borderRadius: "12px", border: "1px solid #DCE7F3", background: "#F8FAFC", padding: "10px 12px", fontSize: "14px", outline: "none", resize: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#94A3B8" }}>תוכן הייצוא</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3.5 rounded-[14px] cursor-pointer" style={{ border: `1px solid ${showSummaryTable ? "#BFDBFE" : "#DCE7F3"}`, background: showSummaryTable ? "#EFF6FF" : "#F8FAFC" }}>
                    <input type="checkbox" checked={showSummaryTable} onChange={(e) => setShowSummaryTable(e.target.checked)} className="w-4 h-4 accent-blue-500" />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>טבלת סיכום</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>סה״כ כמות לכל פריט · {summary.length} שורות</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3.5 rounded-[14px] cursor-pointer" style={{ border: `1px solid ${showDetailsTable ? "#BFDBFE" : "#DCE7F3"}`, background: showDetailsTable ? "#EFF6FF" : "#F8FAFC" }}>
                    <input type="checkbox" checked={showDetailsTable} onChange={(e) => setShowDetailsTable(e.target.checked)} className="w-4 h-4 accent-blue-500" />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>טבלה מפורטת</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>פירוט הזמנות לפי משתמש · {activeDetails.length} שורות</p>
                    </div>
                  </label>
                </div>
              </div>
              <button
                onClick={handleExportPDF}
                disabled={pdfLoading || (!showSummaryTable && !showDetailsTable)}
                className="w-full text-white font-semibold text-sm transition-all"
                style={{ height: "50px", borderRadius: "14px", background: (pdfLoading || (!showSummaryTable && !showDetailsTable)) ? "#94A3B8" : "#1E293B" }}
              >
                {pdfLoading ? "מייצא PDF..." : "ייצא PDF ⬇"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF */}
      <div className="fixed top-[-9999px] left-[-9999px] w-[1100px]" aria-hidden="true">
        <div ref={pdfRef} style={{ fontFamily: "Arial, sans-serif", direction: "rtl", padding: "24px", background: "white" }}>
          <div style={{ marginBottom: "20px", borderBottom: "2px solid #1d4ed8", paddingBottom: "14px" }}>
            {(headerOrg || headerRef2 || headerNotes) ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  {headerOrg && <h1 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e3a5f", margin: "0 0 4px 0" }}>{headerOrg}</h1>}
                  {selectedSection && <p style={{ fontSize: "13px", color: "#3B82F6", margin: 0 }}>סשן: {selectedSection.name} · {formatDate(selectedSection.startDateTime)} — {formatDate(selectedSection.endDateTime)}</p>}
                  {headerNotes && <p style={{ fontSize: "12px", color: "#4B5563", margin: "6px 0 0 0" }}>הערות: {headerNotes}</p>}
                </div>
                <div style={{ textAlign: "left", fontSize: "12px", color: "#374151", flexShrink: 0 }}>
                  {headerDate && <p style={{ margin: "0 0 2px 0" }}>תאריך: {headerDate}</p>}
                  {headerRef2 && <p style={{ margin: 0 }}>מס׳ הזמנה: {headerRef2}</p>}
                </div>
              </div>
            ) : (
              selectedSection && <p style={{ fontSize: "13px", color: "#3B82F6", margin: 0 }}>סשן: {selectedSection.name} · {formatDate(selectedSection.startDateTime)} — {formatDate(selectedSection.endDateTime)}</p>
            )}
          </div>
          {showSummaryTable && summary.length > 0 && (
            <>
              <h2 style={{ fontSize: "14px", fontWeight: "bold", color: "#1e3a5f", margin: "0 0 8px 0" }}>סיכום כמויות · {totalQty} יחידות</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "28px" }}>
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
                  <tr style={{ backgroundColor: "#dbeafe" }}>
                    <td style={{ padding: "6px 10px", fontWeight: "bold", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>סה״כ</td>
                    <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: "bold", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>{totalQty}</td>
                    <td style={{ border: "1px solid #bfdbfe" }} />
                  </tr>
                </tbody>
              </table>
            </>
          )}
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

      <BottomNav isAdmin />
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ color: "#94A3B8" }}>טוען...</div>}>
      <SummaryPageInner />
    </Suspense>
  );
}
