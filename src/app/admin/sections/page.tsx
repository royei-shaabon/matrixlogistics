"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

interface Section {
  id: string;
  name: string;
  status: "active" | "archived";
  windowId: string | null;
  createdAt: string;
}

export default function SectionsPage() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user || d.user.role !== "admin") router.push("/login");
    });
    fetch("/api/users").then((r) => r.json()).then((d) => {
      if (d.users) setPendingCount(d.users.filter((u: { status: string }) => u.status === "pending").length);
    });
    loadSections();
  }, [router]);

  async function loadSections() {
    const res = await fetch("/api/admin/sections");
    const data = await res.json();
    setSections(data.sections || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/admin/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setCreating(false);
    if (!res.ok) { setCreateError("שגיאה ביצירה"); return; }
    setNewName("");
    loadSections();
  }

  async function handleActivate(id: string) {
    setSaving(id + "_activate");
    await fetch(`/api/admin/sections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activate: true }),
    });
    setSaving(null);
    loadSections();
  }

  async function handleArchive(id: string) {
    setSaving(id + "_archive");
    await fetch(`/api/admin/sections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archive: true }),
    });
    setSaving(null);
    loadSections();
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    setSaving(id + "_rename");
    await fetch(`/api/admin/sections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    setSaving(null);
    setEditId(null);
    loadSections();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`למחוק את המדור "${name}"?`)) return;
    setSaving(id + "_delete");
    await fetch(`/api/admin/sections/${id}`, { method: "DELETE" });
    setSaving(null);
    loadSections();
  }

  const activeSection = sections.find((s) => s.status === "active");

  return (
    <div className="min-h-screen" style={{ background: "#F9FBFD", paddingBottom: "90px" }}>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>מדורים</h1>
        {activeSection ? (
          <p className="text-sm mt-0.5" style={{ color: "#16A34A" }}>
            פעיל: {activeSection.name}
          </p>
        ) : (
          <p className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>אין מדור פעיל</p>
        )}
      </div>

      <div className="px-4 space-y-3">
        {/* Create form */}
        <div
          className="rounded-[18px] p-4"
          style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}
        >
          <h2 className="text-sm font-bold mb-3" style={{ color: "#1E293B" }}>צור מדור חדש</h2>
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="שם המדור..."
              className="flex-1 border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ height: "44px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="text-white font-semibold text-sm px-4 transition-all"
              style={{ height: "44px", borderRadius: "12px", background: creating ? "#93C5FD" : "#3B82F6" }}
            >
              {creating ? "..." : "צור"}
            </button>
          </form>
          {createError && <p className="text-xs mt-2" style={{ color: "#EF4444" }}>{createError}</p>}
        </div>

        {/* Sections list */}
        {loading ? (
          <div className="text-center py-12" style={{ color: "#94A3B8" }}>טוען...</div>
        ) : sections.length === 0 ? (
          <div
            className="rounded-[18px] p-10 text-center text-sm"
            style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", color: "#94A3B8" }}
          >
            אין מדורים עדיין
          </div>
        ) : (
          <div className="space-y-2">
            {sections.map((section) => {
              const isActive = section.status === "active";
              const isSaving = saving?.startsWith(section.id);
              const isEditing = editId === section.id;

              return (
                <div
                  key={section.id}
                  className="rounded-[18px] p-4"
                  style={{
                    background: "#FFFFFF",
                    border: `1px solid ${isActive ? "#BBF7D0" : "#DCE7F3"}`,
                    boxShadow: "0px 4px 12px rgba(15,23,42,0.06)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          style={{ height: "40px", borderRadius: "10px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm" style={{ color: "#1E293B" }}>{section.name}</span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              background: isActive ? "#DCFCE7" : "#F1F5F9",
                              color: isActive ? "#15803D" : "#64748B",
                            }}
                          >
                            {isActive ? "פעיל" : "ארכיון"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleRename(section.id)}
                          disabled={!!saving}
                          className="text-white text-xs font-semibold px-3 transition-all"
                          style={{ height: "32px", borderRadius: "8px", background: "#3B82F6" }}
                        >
                          שמור
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="text-xs font-medium px-3 border transition-all"
                          style={{ height: "32px", borderRadius: "8px", borderColor: "#DCE7F3", color: "#64748B" }}
                        >
                          ביטול
                        </button>
                      </>
                    ) : (
                      <>
                        {!isActive && (
                          <button
                            onClick={() => handleActivate(section.id)}
                            disabled={isSaving}
                            className="text-white text-xs font-semibold px-3 transition-all"
                            style={{ height: "32px", borderRadius: "8px", background: isSaving ? "#86EFAC" : "#22C55E" }}
                          >
                            {saving === section.id + "_activate" ? "..." : "הפעל"}
                          </button>
                        )}
                        {isActive && (
                          <button
                            onClick={() => handleArchive(section.id)}
                            disabled={isSaving}
                            className="text-xs font-medium px-3 border transition-all"
                            style={{ height: "32px", borderRadius: "8px", borderColor: "#FED7AA", color: "#C2410C", background: "#FFF7ED" }}
                          >
                            {saving === section.id + "_archive" ? "..." : "העבר לארכיון"}
                          </button>
                        )}
                        <button
                          onClick={() => { setEditId(section.id); setEditName(section.name); }}
                          className="text-xs font-medium px-3 border transition-all"
                          style={{ height: "32px", borderRadius: "8px", borderColor: "#DCE7F3", color: "#64748B", background: "#F8FAFC" }}
                        >
                          שנה שם
                        </button>
                        <button
                          onClick={() => handleDelete(section.id, section.name)}
                          disabled={isSaving}
                          className="text-xs font-medium px-3 border transition-all"
                          style={{ height: "32px", borderRadius: "8px", borderColor: "#FECACA", color: "#EF4444", background: "#FFF1F1" }}
                        >
                          {saving === section.id + "_delete" ? "..." : "מחק"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav isAdmin pendingCount={pendingCount > 0 ? pendingCount : undefined} />
    </div>
  );
}
