"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface FAQ {
  q: string;
  a: string;
}

interface Category {
  title: string;
  items: FAQ[];
}

const CATEGORIES: Category[] = [
  {
    title: "משתמשים - הגשת הזמנות",
    items: [
      {
        q: "איך מגישים הזמנה?",
        a: "נכנסים לסביבה הרלוונטית, בוחרים כמויות לכל פריט ולוחצים על 'שלח הזמנה'. 0 = לא מזמין.",
      },
      {
        q: "האם אפשר לעדכן הזמנה?",
        a: "כן. כל עוד חלון ההזמנה פתוח ניתן לחזור, לשנות כמויות ולשלוח מחדש. ההזמנה הישנה תוחלף.",
      },
      {
        q: "מה קורה אחרי שהסשן נסגר?",
        a: "לא ניתן יותר לערוך או לשלוח הזמנות. כל המידע שנשלח נשמר במערכת לצפייה בלבד.",
      },
      {
        q: "מה עושים אם לא רואים פריטים?",
        a: "ייתכן שאין חלון הזמנה פתוח כרגע, או שהגישה לסביבה עדיין ממתינה לאישור מנהל.",
      },
      {
        q: "איך מצטרפים לסביבה?",
        a: "מקבלים קוד הזמנה מהמנהל, נכנסים לדף הסביבות שלי, ולוחצים על הצטרף עם קוד הזמנה.",
      },
      {
        q: "שכחתי את קוד ההזמנה, מה עושים?",
        a: "פונים למנהל הסביבה, שיכול לאחזר את הקוד מפאנל הניהול ולשלוח אותו שוב.",
      },
    ],
  },
  {
    title: "מנהלי סביבה",
    items: [
      {
        q: "איך פותחים חלון הזמנה?",
        a: "נכנסים לפאנל הניהול, סשנים, לוחצים פתח סשן חדש ומגדירים שם, תאריך ושעת התחלה וסיום.",
      },
      {
        q: "האם אפשר לסגור סשן לפני הזמן?",
        a: "כן. ניתן לסגור ידנית בכל רגע מפאנל הניהול, ואז ההזמנות יינעלו מיידית.",
      },
      {
        q: "האם ניתן לפתוח כמה סשנים במקביל?",
        a: "לא. פתיחת סשן חדש סוגרת אוטומטית את הסשן הפתוח הקודם.",
      },
      {
        q: "איך מאשרים משתמש חדש שהצטרף?",
        a: "נכנסים לניהול, ניהול חברים, רואים את המשתמשים הממתינים ולוחצים אשר.",
      },
      {
        q: "האם אפשר לחסום משתמש?",
        a: "כן. ממסך ניהול החברים ניתן לחסום כל משתמש. משתמש חסום לא יוכל להגיש הזמנות.",
      },
      {
        q: "איך ניתן למחוק סשן ישן?",
        a: "ממסך סשנים בפאנל הניהול ניתן למחוק סשנים שכבר נסגרו.",
      },
    ],
  },
  {
    title: "מערכת והרשאות",
    items: [
      {
        q: "מה זה Super Admin?",
        a: "מנהל ראשי של כל הפלטפורמה. יש לו גישה לכל הסביבות, יכול לאשר סביבות חדשות ולנהל משתמשים גלובליים.",
      },
      {
        q: "מה ההבדל בין מנהל סביבה למשתמש רגיל?",
        a: "מנהל סביבה פותח סשנים, מנהל פריטים ורואה את כל ההזמנות. משתמש רגיל רק מגיש הזמנות.",
      },
      {
        q: "האם המערכת עובדת במובייל?",
        a: "כן. המערכת מותאמת לטלפונים חכמים ולטאבלטים. כל הפונקציות זמינות גם במסך קטן.",
      },
      {
        q: "האם ההזמנות נשמרות אוטומטית?",
        a: "כן. ברגע לחיצה על שלח הזמנה כל הנתונים נשמרים ומוצגים בדוח המנהל מיידית.",
      },
      {
        q: "מה קורה אם נוצרה סביבה חדשה?",
        a: "הסביבה נכנסת לסטטוס ממתין לאישור. Super Admin צריך לאשר אותה לפני שהמשתמשים יוכלו להזמין.",
      },
      {
        q: "האם ניתן להיות חבר בכמה סביבות?",
        a: "כן. ניתן להיות חבר בסביבות מרובות ולעבור ביניהן מדף הסביבות שלי.",
      },
    ],
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function AccordionItem({ q, a }: FAQ) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #E2E8F0" }}>
      <button
        className="w-full flex items-center justify-between gap-4 py-4 text-right"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold" style={{ color: "#1E293B" }}>{q}</span>
        <span className="flex-shrink-0" style={{ color: "#94A3B8" }}>
          <ChevronIcon open={open} />
        </span>
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed" style={{ color: "#64748B" }}>{a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? CATEGORIES.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) => item.q.includes(search) || item.a.includes(search)
        ),
      })).filter((cat) => cat.items.length > 0)
    : CATEGORIES;

  return (
    <div dir="rtl" style={{ background: "#F8FAFC", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Nav */}
      <header style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon.png" alt="Get Supply" width={28} height={28} className="rounded-lg" />
            <span className="text-sm font-bold" style={{ color: "#1E293B" }}>Get Supply</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/guide" className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ color: "#64748B" }}>מדריך שימוש</Link>
            <Link href="/login" className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "#3B82F6", color: "#FFF" }}>כניסה</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="py-12 text-center px-4">
        <h1 className="text-3xl font-black mb-3" style={{ color: "#1E293B" }}>שאלות נפוצות</h1>
        <p className="text-base mb-8" style={{ color: "#64748B" }}>כל מה שצריך לדעת על מערכת ההזמנות.</p>
        <div className="max-w-sm mx-auto relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש שאלה..."
            className="w-full text-sm px-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ height: "48px", borderRadius: "14px", border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#1E293B" }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-3xl mx-auto px-4 pb-20 space-y-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: "#94A3B8" }}>לא נמצאו תוצאות עבור &quot;{search}&quot;</div>
        ) : (
          filtered.map((cat) => (
            <div key={cat.title} className="rounded-[20px] overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
              <div className="px-6 py-4" style={{ borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                <h2 className="text-sm font-bold" style={{ color: "#3B82F6" }}>{cat.title}</h2>
              </div>
              <div className="px-6">
                {cat.items.map((item) => (
                  <AccordionItem key={item.q} {...item} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer CTA */}
      <div className="text-center pb-16 px-4">
        <p className="text-sm mb-3" style={{ color: "#94A3B8" }}>לא מצאתם תשובה?</p>
        <Link href="/guide" className="inline-block text-sm font-bold px-6 py-3 rounded-xl" style={{ background: "#EFF6FF", color: "#3B82F6" }}>
          עיינו במדריך השימוש המלא
        </Link>
      </div>
    </div>
  );
}
