"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

interface Item {
  id: string;
  name: string;
  category?: string;
  unit?: string;
  status: "active" | "inactive";
  sortOrder: number;
}

export default function ItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [envId, setEnvId] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user) { router.push("/login"); return; }
      const isAdmin = d.user.globalRole === "super_admin" || d.user.environmentRole === "environment_admin";
      if (!isAdmin) { router.push("/order"); return; }
      const eid = d.user.currentEnvironmentId;
      if (!eid) { router.push("/environments"); return; }
      setEnvId(eid);
      fetch(`/api/environments/${eid}/items`).then((r) => r.json()).then((data) => {
        setItems(data.items || []);
        setLoading(false);
      });
    });
    fetch("/api/users").then((r) => r.json()).then((d) => {
      if (d.users) setPendingCount(d.users.filter((u: { memberStatus: string }) => u.memberStatus === "pending").length);
    });
  }, [router]);

  async function handleCreate(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!newName.trim() || !envId) return;
    setCreating(true);
    setCreateError("");
    const res = await fetch(`/api/environments/${envId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), category: newCategory.trim() || undefined, unit: newUnit.trim() || undefined }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setCreateError(data.error || "שגיאה ביצירה"); return; }
    setNewName(""); setNewCategory(""); setNewUnit("");
    const refreshed = await fetch(`/api/environments/${envId}/items`).then((r) => r.json());
    setItems(refreshed.items || []);
  }

  async function handleToggle(item: Item) {
    setToggling(item.id);
    const newStatus = item.status === "active" ? "inactive" : "active";
    await fetch(`/api/environments/${envId}/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: newStatus } : i));
    setToggling(null);
  }

  async function handleDelete(item: Item) {
    if (!confirm(`למחוק את "${item.name}"?`)) return;
    setDeleting(item.id);
    const res = await fetch(`/api/environments/${envId}/items/${item.id}`, { method: "DELETE" });
    const data = await res.json();
    setDeleting(null);
    if (!res.ok) { alert(data.error || "שגיאה במחיקה"); return; }
    if (data.deactivated) {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "inactive" } : i));
    } else {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  }

  const categories = [...new Set(items.map((i) => i.category || "כללי"))];

  return (
    <div className="min-h-screen" style={{ background: "#F9FBFD", paddingBottom: "90px" }}>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>ניהול פריטים</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>הפריטים שמשתמשים יכולים להזמין בסביבה זו</p>
      </div>

      <div className="px-4 space-y-3">
        {/* Add item form */}
        <div className="rounded-[18px] p-4" style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: "#1E293B" }}>הוסף פריט</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="שם הפריט *"
              required
              className="w-full border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ height: "44px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="קטגוריה (אופציונלי)"
                className="w-full border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ height: "44px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
              />
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="יחידה (לדוגמה: קג)"
                className="w-full border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ height: "44px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
              />
            </div>
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="w-full text-white font-semibold text-sm transition-all"
              style={{ height: "44px", borderRadius: "12px", background: creating || !newName.trim() ? "#93C5FD" : "#3B82F6" }}
            >
              {creating ? "מוסיף..." : "הוסף פריט"}
            </button>
            {createError && <p className="text-xs" style={{ color: "#EF4444" }}>{createError}</p>}
          </form>
        </div>

        {/* Items list */}
        {loading ? (
          <div className="text-center py-12" style={{ color: "#94A3B8" }}>טוען...</div>
        ) : items.length === 0 ? (
          <div className="rounded-[18px] p-10 text-center text-sm" style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", color: "#94A3B8" }}>
            אין פריטים עדיין — הוסף את הפריט הראשון
          </div>
        ) : (
          categories.map((cat) => {
            const catItems = items.filter((i) => (i.category || "כללי") === cat);
            return (
              <div key={cat}>
                <h2 className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: "#94A3B8" }}>{cat}</h2>
                <div className="rounded-[18px] overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}>
                  {catItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 flex items-center gap-3"
                      style={{
                        borderTop: idx > 0 ? "1px solid #F1F5F9" : undefined,
                        background: item.status === "inactive" ? "#F8FAFC" : undefined,
                        opacity: item.status === "inactive" ? 0.6 : 1,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: "#1E293B" }}>{item.name}</p>
                        {item.unit && <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{item.unit}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggle(item)}
                          disabled={toggling === item.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                          style={{
                            background: item.status === "active" ? "#F1F5F9" : "#DCFCE7",
                            color: item.status === "active" ? "#64748B" : "#15803D",
                            opacity: toggling === item.id ? 0.5 : 1,
                          }}
                        >
                          {toggling === item.id ? "..." : item.status === "active" ? "השבת" : "הפעל"}
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={deleting === item.id}
                          className="flex items-center justify-center rounded-xl border transition-colors"
                          style={{ width: "32px", height: "32px", borderColor: "#FECACA", background: "#FFF1F1", color: "#EF4444", opacity: deleting === item.id ? 0.4 : 1 }}
                        >
                          {deleting === item.id ? <span className="text-xs">...</span> : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav isAdmin pendingCount={pendingCount > 0 ? pendingCount : undefined} />
    </div>
  );
}
