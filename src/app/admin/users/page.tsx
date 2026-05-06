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
  status: "pending" | "approved";
  createdAt: string;
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
                    </p>
                  </div>

                  {user.status === "pending" && (
                    <button
                      onClick={() => approve(user.id)}
                      disabled={approving === user.id}
                      className="text-white text-sm font-semibold px-4 flex-shrink-0 transition-all"
                      style={{ height: "40px", borderRadius: "12px", background: approving === user.id ? "#86EFAC" : "#22C55E" }}
                    >
                      {approving === user.id ? "..." : "אישור"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav isAdmin pendingCount={pendingCount > 0 ? pendingCount : undefined} />
    </div>
  );
}
