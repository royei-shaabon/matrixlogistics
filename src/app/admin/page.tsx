"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

interface Session {
  id: string;
  name: string;
  status: "open" | "closed";
  startDateTime: string;
  endDateTime: string;
}

interface OrderDetails {
  orderDate: string;
  requesterName: string;
  phoneNumber: string;
  customerSite: string;
  deliveryAddress: string;
  matrixEmployeesCount: string;
  courierNotes: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("he-IL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [userName, setUserName] = useState("");
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    orderDate: "", requesterName: "", phoneNumber: "",
    customerSite: "", deliveryAddress: "",
    matrixEmployeesCount: "", courierNotes: "נא להתקשר חצי שעה לפני הגעה",
  });
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user || d.user.role !== "admin") router.push("/login");
      setUserName(d.user?.fullName || d.user?.name || "מנהל");
    });
    fetch("/api/admin/sessions").then((r) => r.json()).then((d) => {
      const sessions: Session[] = d.sessions || [];
      setCurrentSession(sessions.find((s) => s.status === "open") || sessions[0] || null);
    });
    fetch("/api/admin/order-details").then((r) => r.json()).then((d) => {
      if (d.details) setOrderDetails((prev) => ({ ...prev, ...d.details }));
    });
    fetch("/api/users").then((r) => r.json()).then((d) => {
      if (d.users) setPendingCount(d.users.filter((u: { status: string }) => u.status === "pending").length);
    });
    fetch("/api/admin/summary").then((r) => r.json()).then((d) => {
      if (d.summary) setTotalOrders(d.summary.reduce((acc: number, r: { total: number }) => acc + r.total, 0));
    });
  }, [router]);

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setDetailsMsg("");
    setDetailsSaving(true);
    await fetch("/api/admin/order-details", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderDetails),
    });
    setDetailsSaving(false);
    setDetailsMsg("הפרטים נשמרו");
    setTimeout(() => setDetailsMsg(""), 3000);
  }

  async function handleLogout() {
    const { signOut } = await import("firebase/auth");
    const { getFirebaseAuth } = await import("@/lib/firebase-client");
    await signOut(getFirebaseAuth());
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.origin + "/register");
    alert("קישור ההרשמה הועתק!");
  }

  const now = Date.now();
  const isOpen = !!currentSession &&
    currentSession.status === "open" &&
    now >= new Date(currentSession.startDateTime).getTime() &&
    now <= new Date(currentSession.endDateTime).getTime();
  const isPending = !!currentSession &&
    currentSession.status === "open" &&
    now < new Date(currentSession.startDateTime).getTime();

  return (
    <div className="min-h-screen" style={{ background: "#F9FBFD", paddingBottom: "90px" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "#64748B" }}>שלום,</p>
          <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>{userName}</h1>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={copyLink}
            className="text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors"
            style={{ color: "#64748B", borderColor: "#DCE7F3", background: "#FFFFFF" }}
          >
            🔗 שתף קישור
          </button>
          <button
            onClick={handleLogout}
            className="text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors"
            style={{ color: "#64748B", borderColor: "#DCE7F3", background: "#FFFFFF" }}
          >
            יציאה
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-[18px] p-4"
            style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>ממתינים לאישור</p>
            <p className="text-3xl font-bold" style={{ color: pendingCount > 0 ? "#EF4444" : "#1E293B" }}>{pendingCount}</p>
          </div>
          <div
            className="rounded-[18px] p-4"
            style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>יחידות שהוזמנו</p>
            <p className="text-3xl font-bold" style={{ color: "#3B82F6" }}>{totalOrders}</p>
          </div>
        </div>

        {/* Current session status */}
        {currentSession ? (
          <div
            className="rounded-[18px] p-4"
            style={{
              background: isOpen ? "#F0FDF4" : isPending ? "#FFFBEB" : "#FFF7ED",
              border: `1px solid ${isOpen ? "#BBF7D0" : isPending ? "#FDE68A" : "#FED7AA"}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span>{isOpen ? "✅" : isPending ? "⏳" : "🔒"}</span>
                  <span className="font-semibold text-sm" style={{ color: isOpen ? "#15803D" : isPending ? "#92400E" : "#C2410C" }}>
                    {currentSession.name} {isPending ? "· ממתין לפתיחה" : ""}
                  </span>
                </div>
                <p className="text-xs mt-1 mr-6" style={{ color: isOpen ? "#16A34A" : isPending ? "#A16207" : "#EA580C" }}>
                  {formatDate(currentSession.startDateTime)} — {formatDate(currentSession.endDateTime)}
                </p>
              </div>
              <Link
                href="/admin/sessions"
                className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                style={{ background: isOpen ? "#DCFCE7" : "#FEF9C3", color: isOpen ? "#15803D" : "#92400E" }}
              >
                נהל
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/admin/sessions"
            className="rounded-[18px] p-4 flex items-center justify-between"
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A", display: "flex" }}
          >
            <span className="text-sm font-medium" style={{ color: "#92400E" }}>אין סשן פעיל — לחץ לפתיחת סשן</span>
            <span style={{ color: "#92400E" }}>←</span>
          </Link>
        )}

        {/* Submit order (admin) */}
        {isOpen && (
          <Link
            href="/order"
            className="rounded-[18px] p-4 flex items-center justify-between"
            style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex" }}
          >
            <span className="text-sm font-semibold" style={{ color: "#1D4ED8" }}>הגש בקשה לסשן הנוכחי</span>
            <span style={{ color: "#1D4ED8" }}>←</span>
          </Link>
        )}

        {/* Order details form */}
        <div
          className="rounded-[18px] p-5"
          style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}
        >
          <h2 className="text-base font-bold mb-4" style={{ color: "#1E293B" }}>פרטי הזמנה כלליים</h2>
          <form onSubmit={handleSaveDetails} className="space-y-3">
            {([
              { key: "orderDate", label: "תאריך הזמנה", placeholder: "01/06/2025" },
              { key: "requesterName", label: "המזמין", placeholder: "שם מלא" },
              { key: "phoneNumber", label: "מס׳ נייד", placeholder: "050-0000000" },
              { key: "matrixEmployeesCount", label: "מס׳ עובדים באתר", placeholder: "מספר" },
            ] as const).map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>{label}</label>
                <input
                  type="text"
                  value={orderDetails[key]}
                  onChange={(e) => setOrderDetails((d) => ({ ...d, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ height: "48px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>הערות לשליח</label>
              <input
                type="text"
                value={orderDetails.courierNotes}
                onChange={(e) => setOrderDetails((d) => ({ ...d, courierNotes: e.target.value }))}
                className="w-full border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ height: "48px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
              />
            </div>
            <p className="text-xs px-1" style={{ color: "#94A3B8" }}>
              אתר לקוח: שלישות רמת גן · כתובת: בן גוריון 100, רמת גן
            </p>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={detailsSaving}
                className="text-white font-semibold text-sm px-5 transition-all"
                style={{ height: "44px", borderRadius: "12px", background: detailsSaving ? "#94A3B8" : "#1E293B" }}
              >
                {detailsSaving ? "שומר..." : "שמור פרטים"}
              </button>
              {detailsMsg && (
                <span className="text-sm font-medium" style={{ color: "#22C55E" }}>{detailsMsg}</span>
              )}
            </div>
          </form>
        </div>
      </div>

      <BottomNav isAdmin pendingCount={pendingCount > 0 ? pendingCount : undefined} />
    </div>
  );
}
