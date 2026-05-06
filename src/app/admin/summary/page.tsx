"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

interface SummaryRow {
  itemId: number;
  itemName: string;
  total: number;
  notes: string;
}

interface DetailRow {
  userId: string;
  userFullName: string;
  email: string;
  branch: string;
  department: string;
  itemName: string;
  quantity: number;
  orderNote: string;
}

interface UserOrder {
  userId: string;
  userFullName: string;
  email: string;
  branch: string;
  department: string;
  items: { itemName: string; quantity: number; orderNote: string }[];
}

interface OrderWindow {
  startDateTime: string;
  endDateTime: string;
  orderDate?: string;
  requesterName?: string;
  phoneNumber?: string;
  customerSite?: string;
  deliveryAddress?: string;
  matrixEmployeesCount?: string;
  courierNotes?: string;
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
    map.get(row.userId)!.items.push({ itemName: row.itemName, quantity: row.quantity, orderNote: row.orderNote });
  }
  return Array.from(map.values()).sort((a, b) => a.userFullName.localeCompare(b.userFullName, "he"));
}

export default function SummaryPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [details, setDetails] = useState<DetailRow[]>([]);
  const [window_, setWindow] = useState<OrderWindow | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"summary" | "details">("summary");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const pdfRef = useRef<HTMLDivElement>(null);

  async function loadData() {
    const [s, d, od] = await Promise.all([
      fetch("/api/admin/summary").then((r) => r.json()),
      fetch("/api/admin/details").then((r) => r.json()),
      fetch("/api/admin/order-details").then((r) => r.json()),
    ]);
    setSummary(s.summary || []);
    setWindow(s.window || null);
    setDetails(d.details || []);
    setOrderDetails(od.details || {});
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user || d.user.role !== "admin") router.push("/login");
    });
    loadData();
  }, [router]);

  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`למחוק את כל ההזמנה של ${userName}?`)) return;
    setDeleting(userId);
    const res = await fetch(`/api/orders/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setExpanded((prev) => { const next = new Set(prev); next.delete(userId); return next; });
      await loadData();
    } else {
      alert("שגיאה במחיקה");
    }
    setDeleting(null);
  }

  async function handleExportPDF() {
    setPdfLoading(true);
    try {
      const html2pdf = (await import("html2pdf.js" as string)).default;
      const element = pdfRef.current;
      if (!element) return;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `הזמנת-אספקה-${new Date().toLocaleDateString("he-IL").replace(/\//g, "-")}.pdf`,
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

  return (
    <div className="min-h-screen" style={{ background: "#F9FBFD", paddingBottom: "90px" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>סיכום הזמנות</h1>
          {!loading && (
            <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
              {userOrders.length} משתמשים · {totalQty} יחידות
            </p>
          )}
        </div>
        <button
          onClick={handleExportPDF}
          disabled={pdfLoading}
          className="text-sm font-semibold px-4 transition-all print:hidden"
          style={{ height: "40px", borderRadius: "12px", background: "#1E293B", color: "#FFFFFF", opacity: pdfLoading ? 0.5 : 1 }}
        >
          {pdfLoading ? "..." : "PDF ⬇"}
        </button>
      </div>

      <div className="px-4 space-y-3">
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
                  אין הזמנות עדיין
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
                      <span
                        className="text-base font-bold flex-shrink-0 min-w-[36px] text-center"
                        style={{ color: "#3B82F6" }}
                      >
                        {row.total}
                      </span>
                    </div>
                  ))}

                  {/* Total row */}
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
                  אין הזמנות עדיין
                </div>
              ) : (
                <div className="space-y-2">
                  {userOrders.map((user) => {
                    const isOpen = expanded.has(user.userId);
                    const deptColor = getDeptColor(user.department);
                    const isDuplDept = deptUserCount[user.department] > 1;

                    return (
                      <div key={user.userId}>
                        {/* User card */}
                        <div
                          className="rounded-[18px] overflow-hidden"
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #DCE7F3",
                            boxShadow: "0px 4px 12px rgba(15,23,42,0.06)",
                          }}
                        >
                          {/* User row */}
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleExpand(user.userId)}
                            onKeyDown={(e) => e.key === "Enter" && toggleExpand(user.userId)}
                            className="px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-colors"
                            style={{ background: isOpen ? deptColor : undefined }}
                          >
                            <span className="text-sm" style={{ color: "#94A3B8" }}>
                              {isOpen ? "▾" : "▸"}
                            </span>

                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ background: deptColor, border: "1.5px solid rgba(0,0,0,0.15)" }}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate" style={{ color: "#1E293B" }}>
                                  {user.userFullName}
                                </span>
                                {isDuplDept && (
                                  <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                    style={{ background: "#FEF3C7", color: "#92400E" }}
                                  >
                                    כפול
                                  </span>
                                )}
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                                {user.branch} · {user.department}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: "#DBEAFE", color: "#1D4ED8" }}
                              >
                                {user.items.length} פריטים
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(user.userId, user.userFullName); }}
                                disabled={deleting === user.userId}
                                className="text-xs px-2.5 py-1 rounded-lg border transition-colors"
                                style={{
                                  color: "#EF4444", borderColor: "#FECACA", background: "transparent",
                                  opacity: deleting === user.userId ? 0.4 : 1,
                                }}
                              >
                                {deleting === user.userId ? "..." : "מחק"}
                              </button>
                            </div>
                          </div>

                          {/* Expanded items */}
                          {isOpen && (
                            <div style={{ background: deptColor, borderTop: "1px solid rgba(255,255,255,0.6)" }}>
                              {user.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="px-4 py-2.5 flex items-center justify-between gap-3"
                                  style={{ borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.5)" : undefined }}
                                >
                                  <span className="text-sm flex-1" style={{ color: "#374151" }}>{item.itemName}</span>
                                  {item.orderNote && (
                                    <span className="text-xs truncate max-w-[100px]" style={{ color: "#6B7280" }}>
                                      {item.orderNote}
                                    </span>
                                  )}
                                  <span className="font-bold text-sm flex-shrink-0" style={{ color: "#1D4ED8" }}>
                                    {item.quantity}
                                  </span>
                                </div>
                              ))}
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
            <h1 style={{ fontSize: "18px", fontWeight: "bold", color: "#1e3a5f", margin: "0 0 12px 0" }}>
              סל מוצרי מזון לאספקה לעובדי מטריקס באתרים
            </h1>
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
              {details.map((row, i) => (
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
