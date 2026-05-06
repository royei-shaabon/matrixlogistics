"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  fullName: string;
  branch: string;
  department: string;
  status: "pending" | "approved";
  createdAt: string;
}

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
    <div className="min-h-screen">
      <header className="bg-blue-700 text-white px-4 py-3 flex items-center gap-3 shadow">
        <Link href="/admin" className="text-blue-200 hover:text-white text-sm">
          ← חזרה
        </Link>
        <h1 className="font-bold text-lg">ניהול משתמשים</h1>
        {pendingCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
            {pendingCount} ממתינים
          </span>
        )}
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "כולם" : f === "pending" ? "ממתינים" : "מאושרים"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">טוען...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-12 bg-white rounded-2xl border">
            אין משתמשים {filter === "pending" ? "ממתינים" : filter === "approved" ? "מאושרים" : ""}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">שם מלא</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">מייל</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">ענף</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">מדור</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">סטטוס</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => (
                  <tr
                    key={user.id}
                    className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{user.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-gray-600">{user.branch}</td>
                    <td className="px-4 py-3 text-gray-600">{user.department}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {user.status === "approved" ? "מאושר" : "ממתין"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      {user.status === "pending" && (
                        <button
                          onClick={() => approve(user.id)}
                          disabled={approving === user.id}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg px-3 py-1.5"
                        >
                          {approving === user.id ? "מאשר..." : "אישור"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
