"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

interface User {
  id: string;
  email: string;
  fullName: string;
  branch: string;
  department: string;
  role: "admin" | "user";
  status: "pending" | "approved";
  phoneNumber?: string;
  createdAt: string;
}

interface EditForm {
  fullName: string;
  branch: string;
  department: string;
  role: "admin" | "user";
  status: "pending" | "approved";
  phoneNumber: string;
}

const FILTERS = [
  { key: "all", label: "הכל" },
  { key: "pending", label: "ממתינים" },
  { key: "approved", label: "מאושרים" },
] as const;

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ fullName: "", branch: "", department: "", role: "user", status: "pending", phoneNumber: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user || d.user.role !== "admin") router.push("/login");
    });
    loadUsers();
  }, [router]);

  async function loadUsers() {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (data.users) setUsers(data.users);
    setLoading(false);
  }

  async function approve(id: string) {
    setApproving(id);
    await fetch(`/api/users/${id}/approve`, { method: "POST" });
    setApproving(null);
    loadUsers();
  }

  function openEdit(user: User) {
    setEditForm({
      fullName: user.fullName,
      branch: user.branch,
      department: user.department,
      role: user.role,
      status: user.status,
      phoneNumber: user.phoneNumber || "",
    });
    setEditError("");
    setEditUser(user);
  }

  async function handleSaveEdit() {
    if (!editUser) return;
    setEditSaving(true);
    setEditError("");
    const res = await fetch(`/api/users/${editUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setEditError(data.error || "שגיאה בשמירה");
      return;
    }
    setEditUser(null);
    loadUsers();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`למחוק את המשתמש ${name}? פעולה זו אינה הפיכה.`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) { alert("שגיאה במחיקה"); return; }
    loadUsers();
  }

  const filtered = users.filter((u) => filter === "all" || u.status === filter);
  const pendingCount = users.filter((u) => u.status === "pending").length;

  return (
    <div className="min-h-screen" style={{ background: "#F9FBFD", paddingBottom: "90px" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>משתמשים</h1>
        {pendingCount > 0 && (
          <p className="text-sm mt-0.5" style={{ color: "#EF4444" }}>
            {pendingCount} ממתינים לאישור
          </p>
        )}
      </div>

      <div className="px-4 space-y-3">
        {/* Filter chips */}
        <div className="flex gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: filter === key ? "#3B82F6" : "#FFFFFF",
                color: filter === key ? "#FFFFFF" : "#64748B",
                border: `1px solid ${filter === key ? "#3B82F6" : "#DCE7F3"}`,
              }}
            >
              {label}
              {key === "pending" && pendingCount > 0 && (
                <span
                  className="mr-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                  style={{ background: filter === key ? "rgba(255,255,255,0.3)" : "#EF4444", color: "#FFFFFF" }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16" style={{ color: "#94A3B8" }}>טוען...</div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-[18px] p-10 text-center text-sm"
            style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", color: "#94A3B8" }}
          >
            אין משתמשים {filter === "pending" ? "ממתינים" : filter === "approved" ? "מאושרים" : ""}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((user) => (
              <div
                key={user.id}
                className="rounded-[18px] p-4"
                style={{
                  background: "#FFFFFF",
                  border: `1px solid ${user.status === "pending" ? "#FED7AA" : "#DCE7F3"}`,
                  boxShadow: "0px 4px 12px rgba(15,23,42,0.06)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm truncate" style={{ color: "#1E293B" }}>
                        {user.fullName}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          background: user.status === "approved" ? "#DCFCE7" : "#FEF9C3",
                          color: user.status === "approved" ? "#15803D" : "#92400E",
                        }}
                      >
                        {user.status === "approved" ? "מאושר" : "ממתין"}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: "#64748B" }}>{user.email}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                      {user.branch} · {user.department}
                      {user.phoneNumber && ` · ${user.phoneNumber}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {user.status === "pending" && (
                      <button
                        onClick={() => approve(user.id)}
                        disabled={approving === user.id}
                        className="text-white text-sm font-semibold px-4 flex-shrink-0 transition-all"
                        style={{ height: "36px", borderRadius: "10px", background: approving === user.id ? "#86EFAC" : "#22C55E" }}
                      >
                        {approving === user.id ? "..." : "אישור"}
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(user)}
                      className="flex items-center justify-center rounded-xl border transition-colors"
                      style={{ width: "36px", height: "36px", borderColor: "#DCE7F3", background: "#F8FAFC", color: "#64748B" }}
                      title="ערוך"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.fullName)}
                      disabled={deletingId === user.id}
                      className="flex items-center justify-center rounded-xl border transition-colors"
                      style={{ width: "36px", height: "36px", borderColor: "#FECACA", background: "#FFF1F1", color: "#EF4444", opacity: deletingId === user.id ? 0.4 : 1 }}
                      title="מחק"
                    >
                      {deletingId === user.id ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal — bottom sheet */}
      {editUser && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(15,23,42,0.5)" }}
          onClick={() => setEditUser(null)}
        >
          <div
            className="w-full rounded-t-[24px] p-5"
            style={{ background: "#FFFFFF", maxHeight: "92vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: "#DCE7F3" }} />
            </div>

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ color: "#1E293B" }}>עריכת משתמש</h2>
              <button onClick={() => setEditUser(null)} style={{ color: "#94A3B8", fontSize: "20px", lineHeight: 1 }}>✕</button>
            </div>

            <div className="space-y-3">
              {([
                { key: "fullName", label: "שם מלא", type: "text" },
                { key: "branch", label: "ענף", type: "text" },
                { key: "department", label: "מדור", type: "text" },
                { key: "phoneNumber", label: "מספר טלפון", type: "tel" },
              ] as const).map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>{label}</label>
                  <input
                    type={type}
                    value={editForm[key]}
                    onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ height: "48px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>הרשאות</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as "admin" | "user" }))}
                  className="w-full border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ height: "48px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
                >
                  <option value="user">משתמש</option>
                  <option value="admin">מנהל</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>סטטוס</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as "pending" | "approved" }))}
                  className="w-full border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ height: "48px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
                >
                  <option value="pending">ממתין</option>
                  <option value="approved">מאושר</option>
                </select>
              </div>

              {editError && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}>
                  {editError}
                </div>
              )}

              <div className="flex gap-3 pt-1 pb-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  className="flex-1 text-white font-semibold text-sm transition-all"
                  style={{ height: "50px", borderRadius: "14px", background: editSaving ? "#93C5FD" : "#3B82F6" }}
                >
                  {editSaving ? "שומר..." : "שמור"}
                </button>
                <button
                  onClick={() => setEditUser(null)}
                  className="flex-1 font-semibold text-sm border transition-all"
                  style={{ height: "50px", borderRadius: "14px", borderColor: "#DCE7F3", color: "#64748B", background: "#F8FAFC" }}
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav isAdmin pendingCount={pendingCount > 0 ? pendingCount : undefined} />
    </div>
  );
}
