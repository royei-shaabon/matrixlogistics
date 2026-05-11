"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}


interface BottomNavProps {
  isAdmin?: boolean;
  pendingCount?: number;
}

export default function BottomNav({ isAdmin, pendingCount }: BottomNavProps) {
  const pathname = usePathname();

  if (!isAdmin) {
    return (
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 print:hidden"
        style={{ background: "#FFFFFF", borderTop: "1px solid #DCE7F3", paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
      >
        <div className="flex">
          <Link href="/order" className="flex-1 flex flex-col items-center justify-center py-3" style={{ color: pathname === "/order" ? "#3B82F6" : "#94A3B8" }}>
            <ClipboardIcon />
            <span className="text-[11px] font-semibold mt-1">הגשת בקשה</span>
          </Link>
        </div>
      </nav>
    );
  }

  const items = [
    { href: "/admin", label: "ראשי", Icon: HomeIcon },
    { href: "/admin/sessions", label: "סשנים", Icon: LayersIcon },
    { href: "/admin/summary", label: "סיכום", Icon: BarChartIcon },
    { href: "/admin/users", label: "חברים", Icon: UsersIcon, badge: pendingCount },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 print:hidden"
      style={{ background: "#FFFFFF", borderTop: "1px solid #DCE7F3", paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
    >
      <div className="flex">
        {items.map(({ href, label, Icon, badge }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-3 relative transition-colors"
              style={{ color: isActive ? "#3B82F6" : "#94A3B8" }}
            >
              {isActive && (
                <span className="absolute top-0 left-3 right-3 h-0.5 rounded-full" style={{ background: "#3B82F6" }} />
              )}
              <div className="relative">
                <Icon />
                {badge ? (
                  <span className="absolute -top-1.5 -left-1.5 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1" style={{ background: "#EF4444" }}>
                    {badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] font-medium mt-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
