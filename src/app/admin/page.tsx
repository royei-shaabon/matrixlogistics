"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

interface Section {
  id: string;
  name: string;
  status: "open" | "closed";
  startDateTime: string;
  endDateTime: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("he-IL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [userName, setUserName] = useState("");
  const [envName, setEnvName] = useState("");
  const [envId, setEnvId] = useState("");
  const [requireApproval, setRequireApproval] = useState(true);
  const [togglingApproval, setTogglingApproval] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.user) { router.push("/login"); return; }
      const isAdmin = d.user.globalRole === "super_admin" || d.user.environmentRole === "environment_admin";
      if (!isAdmin) { router.push("/order"); return; }
      if (d.user.globalRole === "super_admin") setIsSuperAdmin(true);
      setUserName(d.user.fullName || d.user.name || "מנהל");
      const eid = d.user.currentEnvironmentId;
      if (eid) {
        setEnvId(eid);
        fetch(`/api/environments/${eid}`).then((r) => r.json()).then((env) => {
          setEnvName(env.name || "");
          setRequireApproval(env.requireApproval !== false);
        });

      }
    });
    fetch("/api/admin/sessions").then((r) => r.json()).then((d) => {
      const sections: Section[] = d.sessions || [];
      setCurrentSection(sections.find((s) => s.status === "open") || sections[0] || null);
    });
    fetch("/api/users").then((r) => r.json()).then((d) => {
      if (d.users) setPendingCount(d.users.filter((u: { memberStatus: string }) => u.memberStatus === "pending").length);
    });
    fetch("/api/admin/summary").then((r) => r.json()).then((d) => {
      if (d.summary) setTotalOrders(d.summary.reduce((acc: number, r: { total: number }) => acc + r.total, 0));
    });
  }, [router]);

  async function handleLogout() {
    const { signOut } = await import("firebase/auth");
    const { getFirebaseAuth } = await import("@/lib/firebase-client");
    await signOut(getFirebaseAuth());
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function handleToggleApproval() {
    if (!envId) return;
    setTogglingApproval(true);
    const newVal = !requireApproval;
    await fetch(`/api/environments/${envId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requireApproval: newVal }),
    });
    setRequireApproval(newVal);
    setTogglingApproval(false);
  }

  const now = Date.now();
  const isOpen = !!currentSection &&
    currentSection.status === "open" &&
    now >= new Date(currentSection.startDateTime).getTime() &&
    now <= new Date(currentSection.endDateTime).getTime();
  const isPending = !!currentSection &&
    currentSection.status === "open" &&
    now < new Date(currentSection.startDateTime).getTime();

  return (
    <div className="min-h-screen" style={{ background: "#F9FBFD", paddingBottom: "90px" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "#64748B" }}>שלום,</p>
          <h1 className="text-xl font-bold" style={{ color: "#1E293B" }}>{userName}</h1>
          {envName && <p className="text-xs mt-0.5" style={{ color: "#3B82F6" }}>{envName}</p>}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {isSuperAdmin && (
            <Link
              href="/super-admin"
              className="text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors"
              style={{ color: "#7C3AED", borderColor: "#DDD6FE", background: "#F5F3FF" }}
            >
              ⚙ סופר אדמין
            </Link>
          )}
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
          <div className="rounded-[18px] p-4" style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>ממתינים לאישור</p>
            <p className="text-3xl font-bold" style={{ color: pendingCount > 0 ? "#EF4444" : "#1E293B" }}>{pendingCount}</p>
          </div>
          <div className="rounded-[18px] p-4" style={{ background: "#FFFFFF", border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>יחידות שהוזמנו</p>
            <p className="text-3xl font-bold" style={{ color: "#3B82F6" }}>{totalOrders}</p>
          </div>
        </div>

        {/* Current section status */}
        {currentSection ? (
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
                    {currentSection.name} {isPending ? "· ממתין לפתיחה" : ""}
                  </span>
                </div>
                <p className="text-xs mt-1 mr-6" style={{ color: isOpen ? "#16A34A" : isPending ? "#A16207" : "#EA580C" }}>
                  {formatDate(currentSection.startDateTime)} — {formatDate(currentSection.endDateTime)}
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

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          {envId && (
            <Link
              href="/admin/items"
              className="rounded-[18px] p-4 bg-white flex flex-col gap-1"
              style={{ border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}
            >
              <span className="text-sm font-semibold" style={{ color: "#1E293B" }}>ניהול פריטים</span>
              <span className="text-xs" style={{ color: "#64748B" }}>הוסף / ערוך פריטים בסביבה</span>
            </Link>
          )}
          <Link
            href="/environments"
            className="rounded-[18px] p-4 bg-white flex flex-col gap-1"
            style={{ border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)" }}
          >
            <span className="text-sm font-semibold" style={{ color: "#1E293B" }}>החלף סביבה</span>
            <span className="text-xs" style={{ color: "#64748B" }}>עבור לסביבה אחרת</span>
          </Link>
        </div>

        {/* Require approval toggle */}
        {envId && (
          <button
            onClick={handleToggleApproval}
            disabled={togglingApproval}
            className="w-full rounded-[18px] p-4 bg-white flex items-center justify-between transition-opacity"
            style={{ border: "1px solid #DCE7F3", boxShadow: "0px 4px 12px rgba(15,23,42,0.06)", opacity: togglingApproval ? 0.6 : 1 }}
          >
            <div className="text-right">
              <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>אישור הצטרפות</p>
              <p className="text-xs mt-0.5" style={{ color: requireApproval ? "#64748B" : "#16A34A" }}>
                {requireApproval ? "חברים חדשים ממתינים לאישורך" : "הצטרפות חופשית — אין צורך באישור"}
              </p>
            </div>
            <div
              className="flex-shrink-0 relative transition-colors"
              style={{
                width: "44px", height: "26px", borderRadius: "13px",
                background: requireApproval ? "#CBD5E1" : "#22C55E",
              }}
            >
              <div
                className="absolute top-[3px] transition-all"
                style={{
                  width: "20px", height: "20px", borderRadius: "50%", background: "#FFFFFF",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  right: requireApproval ? "3px" : "21px",
                }}
              />
            </div>
          </button>
        )}
      </div>

      <BottomNav isAdmin pendingCount={pendingCount > 0 ? pendingCount : undefined} />
    </div>
  );
}
