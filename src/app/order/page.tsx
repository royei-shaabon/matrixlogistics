"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PRODUCTS, CATEGORIES } from "@/lib/products";
import BottomNav from "@/components/BottomNav";

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
      if (d.window) { setOrderWindow(d.window); checkWindowOpen(d.window); }
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

  function setQty(productId: number, delta: number) {
    setEntries((prev) => {
      const current = parseInt(prev[productId]?.quantity || "0");
      const next = Math.max(0, current + delta);
      return {
        ...prev,
        [productId]: { quantity: next === 0 ? "" : String(next), notes: prev[productId]?.notes || "" },
      };
    });
    setSaved(false);
  }

  function setNotes(productId: number, value: string) {
    setEntries((prev) => ({
      ...prev,
      [productId]: { quantity: prev[productId]?.quantity || "", notes: value },
    }));
    setSaved(false);
  }

  async function handleSubmit() {
    setError("");
    setSaving(true);
    const items = Object.entries(entries)
      .filter(([, v]) => v.quantity && parseInt(v.quantity) > 0)
      .map(([id, v]) => ({ product_id: parseInt(id), quantity: parseInt(v.quantity), notes: v.notes || undefined }));

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

  const totalItems = Object.values(entries).filter((v) => v.quantity && parseInt(v.quantity) > 0).length;

  return (
    <div className="min-h-screen" style={{ background: "#F9FBFD", paddingBottom: windowOpen && !saved ? "160px" : "80px" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "#64748B" }}>שלום,</p>
          <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>{userName || "..."}</h1>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors"
          style={{ color: "#64748B", borderColor: "#DCE7F3", background: "#FFFFFF" }}
        >
          יציאה
        </button>
      </div>

      <div className="px-4 space-y-3">
        {/* Window status */}
        {orderWindow ? (
          <div
            className="rounded-[18px] p-4"
            style={{
              background: windowOpen ? "#F0FDF4" : "#FFF7ED",
              border: `1px solid ${windowOpen ? "#BBF7D0" : "#FED7AA"}`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{windowOpen ? "✅" : "🔒"}</span>
              <span className="font-semibold text-sm" style={{ color: windowOpen ? "#15803D" : "#C2410C" }}>
                {windowOpen ? "הגשת בקשות פתוחה" : "הגשת בקשות סגורה"}
              </span>
            </div>
            <p className="text-xs mr-6" style={{ color: windowOpen ? "#16A34A" : "#EA580C" }}>
              {formatDate(orderWindow.startDateTime)} — {formatDate(orderWindow.endDateTime)}
            </p>
          </div>
        ) : (
          <div
            className="rounded-[18px] p-4 text-sm"
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}
          >
            לא הוגדר חלון הגשה על ידי המנהל עדיין.
          </div>
        )}

        {/* Success state */}
        {windowOpen && saved && (
          <div
            className="rounded-[18px] p-8 text-center"
            style={{ background: "#FFFFFF", border: "1px solid #BBF7D0", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 mx-auto"
              style={{ background: "#F0FDF4" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-lg font-bold mb-1" style={{ color: "#15803D" }}>בקשתך הוגשה בהצלחה</h2>
            <p className="text-sm mb-6" style={{ color: "#64748B" }}>
              תוכל לערוך אותה עד{" "}
              <span className="font-semibold" style={{ color: "#1E293B" }}>
                {formatDate(orderWindow!.endDateTime)}
              </span>
            </p>
            <button
              onClick={() => setSaved(false)}
              className="font-semibold text-sm px-6 py-3 rounded-[14px] text-white transition-colors"
              style={{ background: "#3B82F6" }}
            >
              ערוך בקשה
            </button>
          </div>
        )}

        {/* Product list */}
        {windowOpen && !saved && (
          <>
            {CATEGORIES.map((cat) => {
              const products = PRODUCTS.filter((p) => p.category === cat);
              return (
                <div key={cat}>
                  <h2 className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: "#94A3B8" }}>
                    {cat}
                  </h2>
                  <div
                    className="rounded-[18px] overflow-hidden"
                    style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}
                  >
                    {products.map((product, idx) => {
                      const entry = entries[product.id];
                      const qty = parseInt(entry?.quantity || "0");
                      const hasValue = qty > 0;

                      return (
                        <div
                          key={product.id}
                          className="px-4 py-3"
                          style={{
                            borderTop: idx > 0 ? "1px solid #F1F5F9" : undefined,
                            background: hasValue ? "#EFF6FF" : undefined,
                          }}
                        >
                          {/* Product name */}
                          <div className="flex items-center justify-between mb-2.5">
                            <span
                              className="text-sm font-medium leading-snug flex-1 ml-3"
                              style={{ color: hasValue ? "#1D4ED8" : "#1E293B" }}
                            >
                              {product.name}
                            </span>
                            {hasValue && (
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: "#DBEAFE", color: "#1D4ED8" }}
                              >
                                {qty}
                              </span>
                            )}
                          </div>

                          {/* Stepper + notes */}
                          <div className="flex items-center gap-3">
                            {/* Stepper */}
                            <div
                              className="flex items-center rounded-xl overflow-hidden flex-shrink-0"
                              style={{ border: "1px solid #DCE7F3", background: "#F8FAFC" }}
                            >
                              <button
                                type="button"
                                onClick={() => setQty(product.id, -1)}
                                className="flex items-center justify-center text-lg font-light transition-colors"
                                style={{ width: "40px", height: "40px", color: qty === 0 ? "#CBD5E1" : "#64748B" }}
                              >
                                −
                              </button>
                              <span
                                className="text-sm font-bold text-center"
                                style={{ width: "36px", color: hasValue ? "#1D4ED8" : "#94A3B8" }}
                              >
                                {qty === 0 ? "0" : qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => setQty(product.id, 1)}
                                className="flex items-center justify-center text-lg transition-colors"
                                style={{ width: "40px", height: "40px", color: "#3B82F6" }}
                              >
                                +
                              </button>
                            </div>

                            {/* Notes */}
                            <input
                              type="text"
                              value={entry?.notes || ""}
                              onChange={(e) => setNotes(product.id, e.target.value)}
                              placeholder="הערה..."
                              className="flex-1 text-sm px-3 focus:outline-none focus:ring-1 focus:ring-blue-300 transition-shadow"
                              style={{ height: "40px", borderRadius: "10px", border: "1px solid #DCE7F3", background: "#F8FAFC" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Error */}
            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}
              >
                {error}
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed submit button — always above BottomNav regardless of scroll position */}
      {windowOpen && !saved && (
        <div
          className="fixed left-0 right-0 z-40 px-4"
          style={{ bottom: "68px", paddingTop: "16px", paddingBottom: "8px", background: "linear-gradient(to bottom, transparent, #F9FBFD 35%)" }}
        >
          <button
            onClick={handleSubmit}
            disabled={saving || totalItems === 0}
            className="w-full text-white font-semibold text-sm transition-all"
            style={{
              height: "54px",
              borderRadius: "14px",
              background: saving || totalItems === 0 ? "#93C5FD" : "#3B82F6",
            }}
          >
            {saving ? "שולח..." : totalItems > 0 ? `הגש בקשה · ${totalItems} פריטים` : "הגש בקשה"}
          </button>
        </div>
      )}

      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
