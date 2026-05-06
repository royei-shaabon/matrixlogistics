"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
        userId: row.userId,
        userFullName: row.userFullName,
        email: row.email,
        branch: row.branch,
        department: row.department,
        items: [],
      });
    }
    map.get(row.userId)!.items.push({
      itemName: row.itemName,
      quantity: row.quantity,
      orderNote: row.orderNote,
    });
  }
  return Array.from(map.values()).sort((a, b) =>
    a.userFullName.localeCompare(b.userFullName, "he")
  );
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

  // Detect departments with multiple users
  const deptUserCount: Record<string, number> = {};
  for (const u of userOrders) {
    deptUserCount[u.department] = (deptUserCount[u.department] || 0) + 1;
  }

  const totalQuantity = summary.reduce((acc, r) => acc + r.total, 0);

  return (
    <div className="min-h-screen">
      <header className="bg-blue-700 text-white px-4 py-3 flex items-center justify-between shadow print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-blue-200 hover:text-white text-sm">← חזרה</Link>
          <h1 className="font-bold text-lg">סיכום הזמנות</h1>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={pdfLoading}
          className="bg-white text-blue-700 text-sm font-medium rounded-lg px-4 py-1.5 hover:bg-blue-50 disabled:opacity-50 flex items-center gap-2"
        >
          {pdfLoading ? "מייצא..." : "⬇️ ייצוא PDF"}
        </button>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        {/* Department legend */}
        {departments.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4 print:hidden">
            <span className="text-xs text-gray-500 self-center">מדור:</span>
            {departments.map((dept) => (
              <span
                key={dept}
                className="text-xs px-2 py-0.5 rounded-full border border-gray-200 font-medium inline-flex items-center gap-1"
                style={{ backgroundColor: getDeptColor(dept) }}
              >
                {dept}
                {deptUserCount[dept] > 1 && (
                  <span className="bg-orange-400 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {deptUserCount[dept]}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 print:hidden">
          {(["summary", "details"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === tab ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            >
              {tab === "summary" ? "סיכום כמויות" : `הזמנות לפי משתמש (${userOrders.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">טוען...</div>
        ) : (
          <>
            {/* Summary tab */}
            <div className={activeTab === "summary" ? "" : "hidden"}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="font-bold text-gray-800">סיכום כמויות</h2>
                  <span className="text-sm text-gray-500">סה״כ {totalQuantity} יחידות</span>
                </div>
                {summary.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">אין הזמנות עדיין</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">פריט</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-700 w-28">סך כמות</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">הערות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map((row, i) => (
                        <tr key={row.itemId} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                          <td className="px-4 py-2.5 text-gray-800">{row.itemName}</td>
                          <td className="px-4 py-2.5 text-center font-bold text-blue-700 text-base">{row.total}</td>
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{row.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Details tab — grouped by user */}
            <div className={activeTab === "details" ? "" : "hidden"}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h2 className="font-bold text-gray-800">הזמנות לפי משתמש</h2>
                  <p className="text-xs text-gray-400 mt-0.5">לחץ על שורה להרחבת הפריטים</p>
                </div>
                {userOrders.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">אין הזמנות עדיין</div>
                ) : (
                  <div>
                    {/* Header */}
                    <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600">
                      <div className="col-span-1"></div>
                      <div className="col-span-3">שם מלא</div>
                      <div className="col-span-2">ענף</div>
                      <div className="col-span-3">מדור</div>
                      <div className="col-span-2 text-center">פריטים</div>
                      <div className="col-span-1"></div>
                    </div>

                    {userOrders.map((user) => {
                      const isOpen = expanded.has(user.userId);
                      const deptColor = getDeptColor(user.department);
                      const isDuplDept = deptUserCount[user.department] > 1;

                      return (
                        <div key={user.userId} className="border-b border-gray-100 last:border-0">
                          {/* User row */}
                          <div
                            onClick={() => toggleExpand(user.userId)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && toggleExpand(user.userId)}
                            className="w-full grid grid-cols-12 items-center px-4 py-3 text-sm text-right hover:bg-gray-50 transition-colors cursor-pointer"
                            style={{ backgroundColor: isOpen ? deptColor : undefined }}
                          >
                            <div className="col-span-1 text-gray-400 text-base">
                              {isOpen ? "▾" : "▸"}
                            </div>
                            <div className="col-span-3 font-medium text-gray-900">{user.userFullName}</div>
                            <div className="col-span-2 text-gray-600">{user.branch}</div>
                            <div className="col-span-3 flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                                style={{ backgroundColor: deptColor, border: "1.5px solid rgba(0,0,0,0.15)" }}
                              />
                              <span className="text-gray-700">{user.department}</span>
                              {isDuplDept && (
                                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                                  כפול
                                </span>
                              )}
                            </div>
                            <div className="col-span-2 text-center">
                              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold rounded-full px-2 py-0.5">
                                {user.items.length} פריטים
                              </span>
                            </div>
                            <div className="col-span-1 text-left">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(user.userId, user.userFullName); }}
                                disabled={deleting === user.userId}
                                className="text-red-400 hover:text-red-600 disabled:opacity-40 text-xs border border-red-200 rounded px-2 py-0.5 hover:bg-red-50 transition-colors"
                              >
                                {deleting === user.userId ? "..." : "מחק"}
                              </button>
                            </div>
                          </div>

                          {/* Expanded items */}
                          {isOpen && (
                            <div style={{ backgroundColor: deptColor }} className="border-t border-white/60">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-500 border-b border-white/60">
                                    <th className="text-right px-8 py-1.5 font-medium">פריט</th>
                                    <th className="text-center px-4 py-1.5 font-medium w-20">כמות</th>
                                    <th className="text-right px-4 py-1.5 font-medium">הערות</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {user.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-white/40 last:border-0">
                                      <td className="px-8 py-1.5 text-gray-800">{item.itemName}</td>
                                      <td className="px-4 py-1.5 text-center font-bold text-blue-700">{item.quantity}</td>
                                      <td className="px-4 py-1.5 text-gray-500">{item.orderNote || "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
    </div>
  );
}
