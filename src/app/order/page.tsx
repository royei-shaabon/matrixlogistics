"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PRODUCTS, CATEGORIES } from "@/lib/products";

interface OrderWindow {
  windowId: string;
  startDateTime: string;
  endDateTime: string;
}

interface OrderEntry {
  [productId: number]: { quantity: string; notes: string };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("he-IL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function OrderPage() {
  const router = useRouter();
  const [orderWindow, setOrderWindow] = useState<OrderWindow | null>(null);
  const [entries, setEntries] = useState<OrderEntry>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [windowOpen, setWindowOpen] = useState(false);

  const checkWindowOpen = useCallback((w: OrderWindow) => {
    const now = new Date().toISOString();
    setWindowOpen(now >= w.startDateTime && now <= w.endDateTime);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user) { router.push("/login"); return; }
      if (d.user.status === "pending" && d.user.role !== "admin") { router.push("/pending"); return; }
      setUserName(d.user.fullName || d.user.name || "");
      setIsAdmin(d.user.role === "admin");
    });

    fetch("/api/order-window").then((r) => r.json()).then((d) => {
      if (d.window) {
        setOrderWindow(d.window);
        checkWindowOpen(d.window);
      }
    });

    fetch("/api/orders").then((r) => r.json()).then((d) => {
      if (d.items) {
        const map: OrderEntry = {};
        for (const item of d.items) {
          map[item.itemId] = { quantity: String(item.quantity), notes: item.orderNote || "" };
        }
        setEntries(map);
      }
    });
  }, [router, checkWindowOpen]);

  useEffect(() => {
    if (!orderWindow) return;
    const t = setInterval(() => checkWindowOpen(orderWindow), 60000);
    return () => clearInterval(t);
  }, [orderWindow, checkWindowOpen]);

  function handleChange(productId: number, field: "quantity" | "notes", value: string) {
    setEntries((prev) => ({
      ...prev,
      [productId]: {
        quantity: prev[productId]?.quantity || "",
        notes: prev[productId]?.notes || "",
        [field]: value,
      },
    }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const items = Object.entries(entries)
      .filter(([, v]) => v.quantity && parseInt(v.quantity) > 0)
      .map(([id, v]) => ({
        product_id: parseInt(id),
        quantity: parseInt(v.quantity),
        notes: v.notes || undefined,
      }));

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error || "שגיאה בשמירה"); return; }
    setSaved(true);
  }

  async function handleLogout() {
    const { signOut } = await import("firebase/auth");
    const { getFirebaseAuth } = await import("@/lib/firebase-client");
    await signOut(getFirebaseAuth());
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const totalItems = Object.values(entries).filter(
    (v) => v.quantity && parseInt(v.quantity) > 0
  ).length;

  return (
    <div className="min-h-screen">
      <header className="bg-blue-700 text-white px-4 py-3 flex items-center justify-between shadow">
        <div>
          <h1 className="font-bold text-lg">הזמנת אספקה — מטריקס</h1>
          {userName && <p className="text-blue-200 text-xs">שלום, {userName}</p>}
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link href="/admin" className="text-blue-200 hover:text-white text-sm underline">
              לוח מנהל
            </Link>
          )}
          <button onClick={handleLogout} className="text-blue-200 hover:text-white text-sm underline">
            יציאה
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {orderWindow ? (
          <div className={`rounded-xl border p-4 mb-6 ${windowOpen ? "bg-green-50 border-green-300 text-green-800" : "bg-red-50 border-red-300 text-red-800"}`}>
            <div className="font-semibold text-sm mb-1">
              {windowOpen ? "✅ ההזמנה פתוחה" : "🔒 ההזמנה סגורה"}
            </div>
            <div className="text-xs">
              {formatDate(orderWindow.startDateTime)} — {formatDate(orderWindow.endDateTime)}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 text-yellow-800 p-4 mb-6 text-sm">
            לא הוגדר חלון הזמנה על ידי המנהל עדיין.
          </div>
        )}

        {windowOpen && (
          saved ? (
            <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-10 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-green-800 mb-2">בקשתך הוגשה בהצלחה!</h2>
              <p className="text-gray-500 text-sm mb-6">
                תוכל לערוך אותה עד{" "}
                <span className="font-semibold text-gray-700">
                  {formatDate(orderWindow!.endDateTime)}
                </span>
              </p>
              <button
                onClick={() => setSaved(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-6 py-2.5 text-sm transition-colors"
              >
                ערוך בקשה
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-4">
                <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
                  <div className="col-span-5">פריט</div>
                  <div className="col-span-3 text-center">כמות להזמנה</div>
                  <div className="col-span-4">הערות להזמנה</div>
                </div>

                {CATEGORIES.map((cat) => {
                  const products = PRODUCTS.filter((p) => p.category === cat);
                  return (
                    <div key={cat}>
                      <div className="bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 border-b border-blue-100 uppercase tracking-wide">
                        {cat}
                      </div>
                      {products.map((product, idx) => {
                        const entry = entries[product.id];
                        const hasValue = entry?.quantity && parseInt(entry.quantity) > 0;
                        return (
                          <div
                            key={product.id}
                            className={`grid grid-cols-12 items-center px-4 py-2 text-sm border-b border-gray-100 ${hasValue ? "bg-blue-50" : idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                          >
                            <div className="col-span-5 text-gray-800">{product.name}</div>
                            <div className="col-span-3 flex justify-center">
                              <input
                                type="number"
                                min="0"
                                value={entry?.quantity || ""}
                                onChange={(e) => handleChange(product.id, "quantity", e.target.value)}
                                placeholder="0"
                                className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                              />
                            </div>
                            <div className="col-span-4">
                              <input
                                type="text"
                                value={entry?.notes || ""}
                                onChange={(e) => handleChange(product.id, "notes", e.target.value)}
                                placeholder="הערה (אופציונלי)"
                                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 bg-transparent"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="text-sm text-gray-500">
                  {totalItems > 0 ? `${totalItems} פריטים נבחרו` : "לא נבחרו פריטים עדיין"}
                </div>
                <div className="flex items-center gap-3">
                  {error && <span className="text-red-600 text-sm">{error}</span>}
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl px-6 py-2.5 text-sm transition-colors"
                  >
                    {saving ? "שולח..." : "הגש בקשה"}
                  </button>
                </div>
              </div>
            </form>
          )
        )}
      </div>
    </div>
  );
}
