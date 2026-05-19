"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

function MenuIcon() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="19" y2="6" />
      <line x1="3" y1="12" x2="19" y2="12" />
      <line x1="3" y1="18" x2="19" y2="18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function OrderMockup() {
  return (
    <div
      className="w-full max-w-sm mx-auto rounded-[20px] overflow-hidden"
      style={{ background: "#FFFFFF", boxShadow: "0 20px 60px rgba(15,23,42,0.15)", border: "1px solid #E2E8F0" }}
      dir="rtl"
    >
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#EFF6FF", borderBottom: "1px solid #DBEAFE" }}>
        <span className="text-xs font-bold" style={{ color: "#1D4ED8" }}>סשן פתוח</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#22C55E", color: "#FFF" }}>פעיל</span>
      </div>
      <div className="p-4 space-y-3">
        {[
          { name: "כפפות ניתוח", unit: "קופסה", qty: 3 },
          { name: "מסכות N95", unit: "יחידה", qty: 10 },
          { name: "חוסמי עורקים", unit: "יחידה", qty: 5 },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>{item.name}</p>
              <p className="text-[11px]" style={{ color: "#94A3B8" }}>{item.unit}</p>
            </div>
            <div
              className="flex items-center justify-center rounded-xl font-bold text-sm"
              style={{ width: "48px", height: "36px", background: "#EFF6FF", color: "#3B82F6", border: "1px solid #BFDBFE" }}
            >
              {item.qty}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <div className="w-full rounded-[12px] py-3 text-center text-sm font-bold" style={{ background: "#3B82F6", color: "#FFFFFF" }}>
          שלח הזמנה
        </div>
      </div>
    </div>
  );
}

const HOW_IT_WORKS = [
  { num: "01", title: "פותחים חלון הזמנה", desc: "המנהל מגדיר זמני פתיחה וסגירה. המערכת מתחילה לקבל הזמנות אוטומטית.", color: "#EFF6FF", numColor: "#3B82F6" },
  { num: "02", title: "המשתמשים מזמינים", desc: "כל משתמש נכנס לסביבה שלו, בוחר כמויות ושולח. מהיר וברור.", color: "#F0FDF4", numColor: "#22C55E" },
  { num: "03", title: "מקבלים סיכום מסודר", desc: "המערכת מרכזת את כל הנתונים. המנהל מקבל דוח מסכם מוכן לייצוא.", color: "#FFF7ED", numColor: "#F59E0B" },
];

const WHO_FOR = [
  "יחידות לוגיסטיקה", "גופי מילואים", "עמותות וארגונים",
  "מחסנים וספקים", "בתי ספר", "קבוצות ציוד",
];

const BENEFITS = [
  "ניהול הזמנות מרוכז, הכל במקום אחד",
  "שליטה מלאה בזמני הזמנה",
  "עדכון הזמנות בזמן אמת",
  "ניהול משתמשים והרשאות בקלות",
  "ייצוא דוחות מסכמים ל-PDF",
  "תמיכה מלאה במובייל ובדסקטופ",
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div dir="rtl" style={{ background: "#F8FAFC", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* NAV */}
      <header style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/icon.png" alt="Get Supply" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-base" style={{ color: "#1E293B" }}>Get Supply</span>
          </div>

          <nav className="hidden md:flex items-center gap-3">
            <Link href="/faq" className="text-sm font-medium px-3 py-1.5 rounded-lg" style={{ color: "#64748B" }}>שאלות נפוצות</Link>
            <Link href="/guide" className="text-sm font-medium px-3 py-1.5 rounded-lg" style={{ color: "#64748B" }}>מדריך שימוש</Link>
            <Link href="/register" className="text-sm font-medium px-4 py-2 rounded-xl border" style={{ color: "#1E293B", borderColor: "#CBD5E1" }}>הרשמה</Link>
            <Link href="/login" className="text-sm font-bold px-4 py-2 rounded-xl" style={{ background: "#3B82F6", color: "#FFFFFF" }}>כניסה</Link>
          </nav>

          <button className="md:hidden p-2 rounded-lg" style={{ color: "#64748B" }} onClick={() => setMenuOpen((v) => !v)}>
            <MenuIcon />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-2" style={{ borderTop: "1px solid #E2E8F0", background: "#FFFFFF" }}>
            <Link href="/faq" className="block py-2 text-sm font-medium" style={{ color: "#64748B" }} onClick={() => setMenuOpen(false)}>שאלות נפוצות</Link>
            <Link href="/guide" className="block py-2 text-sm font-medium" style={{ color: "#64748B" }} onClick={() => setMenuOpen(false)}>מדריך שימוש</Link>
            <div className="flex gap-2 pt-1">
              <Link href="/register" className="flex-1 text-center py-2 rounded-xl border text-sm font-medium" style={{ color: "#1E293B", borderColor: "#CBD5E1" }}>הרשמה</Link>
              <Link href="/login" className="flex-1 text-center py-2 rounded-xl text-sm font-bold" style={{ background: "#3B82F6", color: "#FFFFFF" }}>כניסה</Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-5" style={{ background: "#EFF6FF", color: "#3B82F6" }}>
              ניהול הזמנות ציוד
            </span>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-5" style={{ color: "#1E293B" }}>
              מנהלים הזמנות ציוד בצורה מסודרת.
              <span className="block mt-1" style={{ color: "#3B82F6" }}>בלי בלאגן.</span>
            </h1>
            <p className="text-lg mb-8" style={{ color: "#64748B", lineHeight: 1.7 }}>
              פתיחת חלונות הזמנה, איסוף כמויות, ניהול משתמשים ודוחות מסכמים. בלי וואטסאפ, בלי אקסלים.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/login" className="px-6 py-3 rounded-xl font-bold text-white text-base" style={{ background: "#3B82F6", boxShadow: "0 4px 14px rgba(59,130,246,0.35)" }}>
                כניסה למערכת
              </Link>
              <Link href="/register" className="px-6 py-3 rounded-xl font-semibold text-base border" style={{ color: "#1E293B", borderColor: "#CBD5E1", background: "#FFFFFF" }}>
                הרשמה
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <OrderMockup />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20" style={{ background: "#FFFFFF" }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3" style={{ color: "#1E293B" }}>איך זה עובד?</h2>
            <p className="text-base" style={{ color: "#64748B" }}>שלושה צעדים פשוטים מרגע ההתחברות ועד לסיכום.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((card) => (
              <div key={card.num} className="rounded-[20px] p-6" style={{ background: card.color }}>
                <span className="block text-4xl font-black mb-4" style={{ color: card.numColor, opacity: 0.4 }}>{card.num}</span>
                <h3 className="text-lg font-bold mb-2" style={{ color: "#1E293B" }}>{card.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IS IT FOR */}
      <section className="py-20" style={{ background: "#F8FAFC" }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3" style={{ color: "#1E293B" }}>למי זה מתאים?</h2>
            <p className="text-base" style={{ color: "#64748B" }}>כל גוף שצריך לרכז הזמנות מקבוצה של אנשים.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {WHO_FOR.map((item) => (
              <div key={item} className="rounded-[16px] px-5 py-4 text-center text-sm font-semibold" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#1E293B", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-20" style={{ background: "#FFFFFF" }}>
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-8 text-center" style={{ color: "#1E293B" }}>יתרונות עיקריים</h2>
          <ul className="space-y-4">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5" style={{ background: "#EFF6FF" }}>
                  <CheckIcon />
                </span>
                <span className="text-base" style={{ color: "#334155" }}>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: "#1E293B" }}>
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-4" style={{ color: "#F1F5F9" }}>רוצים להתחיל?</h2>
          <p className="text-sm mb-8" style={{ color: "#94A3B8" }}>
            צרו סביבה חדשה, או הצטרפו עם קוד הזמנה שקיבלתם ממנהל הסביבה.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/login" className="px-8 py-3 rounded-xl font-bold text-base" style={{ background: "#3B82F6", color: "#FFFFFF" }}>
              כניסה למערכת
            </Link>
            <Link href="/register" className="px-8 py-3 rounded-xl font-semibold text-base border" style={{ color: "#94A3B8", borderColor: "#334155" }}>
              הרשמה
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0F172A", borderTop: "1px solid #1E293B" }}>
        <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/icon.png" alt="Get Supply" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-bold" style={{ color: "#64748B" }}>Get Supply</span>
          </div>
          <nav className="flex flex-wrap gap-5 justify-center">
            {[
              { href: "/faq", label: "שאלות נפוצות" },
              { href: "/guide", label: "מדריך שימוש" },
              { href: "/privacy", label: "מדיניות פרטיות" },
              { href: "/login", label: "כניסה" },
              { href: "/register", label: "הרשמה" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-sm" style={{ color: "#475569" }}>{label}</Link>
            ))}
          </nav>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-6 text-center">
          <p className="text-xs" style={{ color: "#334155" }}>כל הזכויות שמורות לRoyei Villiam Shaabon 2026</p>
        </div>
      </footer>
    </div>
  );
}
