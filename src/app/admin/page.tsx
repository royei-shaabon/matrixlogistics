"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OrderWindow {
  windowId: string;
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

function toLocalInput(iso: string) {
  return new Date(iso).toISOString().slice(0, 16);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("he-IL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [orderWindow, setOrderWindow] = useState<OrderWindow | null>(null);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [windowMsg, setWindowMsg] = useState("");
  const [windowSaving, setWindowSaving] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    orderDate: "", requesterName: "", phoneNumber: "",
    customerSite: "שלישות רמת גן", deliveryAddress: "בן גוריון 100, רמת גן",
    matrixEmployeesCount: "", courierNotes: "נא להתקשר חצי שעה לפני הגעה",
  });
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user || d.user.role !== "admin") router.push("/login");
    });

    fetch("/api/order-window").then((r) => r.json()).then((d) => {
      if (d.window) {
        setOrderWindow(d.window);
        setStartAt(toLocalInput(d.window.startDateTime));
        setEndAt(toLocalInput(d.window.endDateTime));
      }
    });

    fetch("/api/admin/order-details").then((r) => r.json()).then((d) => {
      if (d.details) setOrderDetails((prev) => ({ ...prev, ...d.details }));
    });

    fetch("/api/users").then((r) => r.json()).then((d) => {
      if (d.users) setPendingCount(d.users.filter((u: { status: string }) => u.status === "pending").length);
    });
  }, [router]);

  async function handleSaveWindow(e: React.FormEvent) {
    e.preventDefault();
    setWindowMsg("");
    setWindowSaving(true);

    const method = orderWindow ? "PATCH" : "POST";
    const res = await fetch("/api/order-window", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
      }),
    });

    const data = await res.json();
    setWindowSaving(false);

    if (!res.ok) {
      setWindowMsg("❌ " + (data.error || "שגיאה"));
      return;
    }

    setWindowMsg("✓ חלון ההזמנה עודכן");
    setTimeout(() => setWindowMsg(""), 3000);

    const fresh = await fetch("/api/order-window").then((r) => r.json());
    if (fresh.window) setOrderWindow(fresh.window);
  }

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
    setDetailsMsg("✓ הפרטים נשמרו");
    setTimeout(() => setDetailsMsg(""), 3000);
  }

  async function handleLogout() {
    const { signOut } = await import("firebase/auth");
    const { getFirebaseAuth } = await import("@/lib/firebase-client");
    await signOut(getFirebaseAuth());
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const now = new Date().toISOString();
  const isOpen = orderWindow && now >= orderWindow.startDateTime && now <= orderWindow.endDateTime;

  function copyLink() {
    navigator.clipboard.writeText(window.location.origin + "/register");
    alert("קישור ההרשמה הועתק!");
  }

  return (
    <div className="min-h-screen">
      <header className="bg-blue-700 text-white px-4 py-3 flex items-center justify-between shadow">
        <h1 className="font-bold text-lg">לוח מנהל — מטריקס</h1>
        <button onClick={handleLogout} className="text-blue-200 hover:text-white text-sm underline">
          יציאה
        </button>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Quick nav */}
        <div className="grid grid-cols-4 gap-3">
          <Link href="/order" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">📝</div>
            <div className="font-semibold text-sm text-gray-800">הגש הזמנה</div>
          </Link>
          <Link href="/admin/users" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">👥</div>
            <div className="font-semibold text-sm text-gray-800">ניהול משתמשים</div>
            {pendingCount > 0 && (
              <div className="mt-1 inline-block bg-red-100 text-red-700 text-xs font-bold rounded-full px-2 py-0.5">
                {pendingCount} ממתינים
              </div>
            )}
          </Link>
          <Link href="/admin/summary" className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">📊</div>
            <div className="font-semibold text-sm text-gray-800">סיכום הזמנות</div>
          </Link>
          <button onClick={copyLink} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">🔗</div>
            <div className="font-semibold text-sm text-gray-800">העתק קישור הרשמה</div>
          </button>
        </div>

        {/* Window status */}
        {orderWindow && (
          <div className={`rounded-xl border p-3 text-sm ${isOpen ? "bg-green-50 border-green-300 text-green-800" : "bg-orange-50 border-orange-300 text-orange-800"}`}>
            <span className="font-semibold">{isOpen ? "✅ חלון הזמנה פתוח" : "🔒 חלון הזמנה סגור"}</span>
            <span className="mr-2 text-xs">{formatDate(orderWindow.startDateTime)} — {formatDate(orderWindow.endDateTime)}</span>
          </div>
        )}

        {/* Set / extend window */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-bold text-gray-800 mb-1">
            ⏰ {orderWindow ? "הארכת / עדכון חלון הגשה" : "הגדרת חלון הגשה"}
          </h2>
          {orderWindow && (
            <p className="text-xs text-gray-400 mb-4">שינוי זמן הסיום יאריך את חלון ההגשה הקיים</p>
          )}
          <form onSubmit={handleSaveWindow} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מתאריך ושעה</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">עד תאריך ושעה</label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={windowSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-5 py-2 text-sm"
              >
                {windowSaving ? "שומר..." : orderWindow ? "עדכן חלון הגשה" : "צור חלון הגשה"}
              </button>
              {windowMsg && (
                <span className={windowMsg.startsWith("❌") ? "text-red-600 text-sm" : "text-green-600 text-sm"}>
                  {windowMsg}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* General order details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-bold text-gray-800 mb-4">📋 פרטי הזמנה כלליים (מנהל בלבד)</h2>
          <form onSubmit={handleSaveDetails} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "orderDate", label: "תאריך הזמנה", placeholder: "01/06/2025" },
                { key: "requesterName", label: "המזמין (שם מלא)", placeholder: "שם המזמין" },
                { key: "phoneNumber", label: "מס׳ נייד", placeholder: "050-0000000" },
                { key: "matrixEmployeesCount", label: "מס׳ עובדי מטריקס באתר", placeholder: "מספר עובדים" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={orderDetails[key as keyof OrderDetails]}
                    onChange={(e) => setOrderDetails((d) => ({ ...d, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">הערות לשליח</label>
              <input
                type="text"
                value={orderDetails.courierNotes}
                onChange={(e) => setOrderDetails((d) => ({ ...d, courierNotes: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 border">
              <strong>קבוע:</strong> אתר לקוח: שלישות רמת גן | כתובת: בן גוריון 100, רמת גן
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={detailsSaving}
                className="bg-gray-700 hover:bg-gray-800 disabled:opacity-50 text-white font-medium rounded-lg px-5 py-2 text-sm"
              >
                {detailsSaving ? "שומר..." : "שמור פרטים"}
              </button>
              {detailsMsg && <span className="text-green-600 text-sm">{detailsMsg}</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
