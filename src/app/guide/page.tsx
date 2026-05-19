"use client";

import { useState } from "react";
import Link from "next/link";

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
        style={{ background: "#EFF6FF", color: "#3B82F6" }}
      >
        {num}
      </span>
      <span className="text-sm leading-relaxed" style={{ color: "#334155" }}>{text}</span>
    </div>
  );
}

function Note({ text }: { text: string }) {
  return (
    <div className="rounded-[12px] px-4 py-3 flex gap-2 items-start" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
      <span style={{ color: "#F59E0B" }}>⚠</span>
      <span className="text-sm" style={{ color: "#92400E" }}>{text}</span>
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className="rounded-[12px] px-4 py-3 flex gap-2 items-start" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
      <span style={{ color: "#22C55E" }}>✓</span>
      <span className="text-sm" style={{ color: "#166534" }}>{text}</span>
    </div>
  );
}

function Tag({ text, color = "#EFF6FF", textColor = "#3B82F6" }: { text: string; color?: string; textColor?: string }) {
  return (
    <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: color, color: textColor }}>
      {text}
    </span>
  );
}

const SECTIONS: Section[] = [
  {
    id: "intro",
    title: "מבוא",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>
          <strong>Matrix Supply Order</strong> היא מערכת לניהול הזמנות ציוד בצורה מסודרת ומרוכזת.
          במקום הודעות מפוזרות, טבלאות אקסל וטעויות ידניות — כל ההזמנות מרוכזות במקום אחד.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>
          המערכת פועלת לפי עקרון <strong>סביבות</strong>: כל קבוצה, יחידה או מחסן מקבלים סביבה נפרדת
          עם חברים, פריטים וחלונות הזמנה משלהם.
        </p>
        <div className="grid grid-cols-1 gap-3 pt-2">
          {[
            { role: "משתמש רגיל", desc: "מגיש הזמנות בזמן שהחלון פתוח", color: "#EFF6FF", tc: "#3B82F6" },
            { role: "מנהל סביבה", desc: "פותח סשנים, מנהל פריטים ורואה דוחות", color: "#F0FDF4", tc: "#16A34A" },
            { role: "Super Admin", desc: "גישה מלאה לכל הפלטפורמה", color: "#F5F3FF", tc: "#7C3AED" },
          ].map((r) => (
            <div key={r.role} className="flex items-start gap-3 p-3 rounded-[12px]" style={{ background: r.color }}>
              <Tag text={r.role} color={r.color} textColor={r.tc} />
              <span className="text-sm" style={{ color: "#334155" }}>{r.desc}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "register",
    title: "התחברות והרשמה",
    content: (
      <div className="space-y-5">
        <div className="space-y-3">
          <h4 className="text-sm font-bold" style={{ color: "#1E293B" }}>הרשמה למערכת</h4>
          <div className="space-y-2">
            <Step num={1} text="נכנסים לדף ההרשמה ובוחרים: אימייל וסיסמה, או התחברות מהירה עם Google." />
            <Step num={2} text="ממלאים שם מלא ומספר טלפון — אלו יופיעו בהזמנות שלכם." />
            <Step num={3} text="לאחר ההרשמה מגיעים לדף 'הסביבות שלי' ומשם מתחילים." />
          </div>
        </div>
        <Tip text="אם כבר קיבלתם קוד הזמנה ממנהל — הירשמו ואז הצטרפו עם הקוד." />
      </div>
    ),
  },
  {
    id: "join",
    title: "הצטרפות לסביבה",
    content: (
      <div className="space-y-5">
        <div className="space-y-3">
          <h4 className="text-sm font-bold" style={{ color: "#1E293B" }}>הצטרפות עם קוד הזמנה</h4>
          <div className="space-y-2">
            <Step num={1} text="נכנסים ל'הסביבות שלי'." />
            <Step num={2} text="מזינים את קוד ההזמנה שקיבלתם בשדה 'הצטרף עם קוד הזמנה'." />
            <Step num={3} text="לוחצים 'הצטרף'. אם הסביבה דורשת אישור — תועברו לסטטוס 'ממתין'." />
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-bold" style={{ color: "#1E293B" }}>יצירת סביבה חדשה</h4>
          <div className="space-y-2">
            <Step num={1} text="לוחצים 'צור סביבה חדשה'." />
            <Step num={2} text="ממלאים שם ותיאור (אופציונלי)." />
            <Step num={3} text="הסביבה נכנסת לסטטוס 'ממתין לאישור' — Super Admin יאשר אותה." />
          </div>
        </div>
        <Note text="לא ניתן להזמין פריטים עד שהסביבה מאושרת ויש חלון הזמנה פתוח." />
      </div>
    ),
  },
  {
    id: "order",
    title: "הגשת הזמנה",
    content: (
      <div className="space-y-5">
        <div className="space-y-3">
          <h4 className="text-sm font-bold" style={{ color: "#1E293B" }}>שלבי הגשה</h4>
          <div className="space-y-2">
            <Step num={1} text="נכנסים לסביבה הרצויה מדף 'הסביבות שלי'." />
            <Step num={2} text="כאשר יש חלון הזמנה פתוח — מוצגת רשימת הפריטים הזמינים." />
            <Step num={3} text="מזינים כמות לכל פריט שרוצים להזמין. 0 = לא מזמין." />
            <Step num={4} text="לוחצים 'שלח הזמנה' — ההזמנה נשמרת מיידית." />
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-bold" style={{ color: "#1E293B" }}>עדכון הזמנה</h4>
          <p className="text-sm" style={{ color: "#64748B" }}>
            כל עוד הסשן פתוח ניתן לחזור, לשנות כמויות ולשלוח מחדש. ההזמנה החדשה מחליפה את הקודמת.
          </p>
        </div>
        <Tip text="ניתן לשלוח הזמנה עם פריטים חלקיים — לא חייבים למלא הכל." />
        <Note text="לאחר סגירת הסשן לא ניתן יותר לשנות הזמנות." />
      </div>
    ),
  },
  {
    id: "admin-sessions",
    title: "ניהול סשנים",
    content: (
      <div className="space-y-5">
        <div className="rounded-[12px] px-3 py-2 inline-flex items-center gap-1.5 mb-1" style={{ background: "#F0FDF4" }}>
          <Tag text="מנהל סביבה בלבד" color="#F0FDF4" textColor="#16A34A" />
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-bold" style={{ color: "#1E293B" }}>פתיחת חלון הזמנה חדש</h4>
          <div className="space-y-2">
            <Step num={1} text="נכנסים לפאנל הניהול." />
            <Step num={2} text="לוחצים 'פתח סשן חדש'." />
            <Step num={3} text="מגדירים: שם הסשן, תאריך ושעת התחלה, תאריך ושעת סיום." />
            <Step num={4} text="לוחצים 'צור'. המשתמשים יכולים להזמין מיד." />
          </div>
        </div>
        <Note text="פתיחת סשן חדש סוגרת אוטומטית כל סשן פתוח קודם." />
        <div className="space-y-2">
          <h4 className="text-sm font-bold" style={{ color: "#1E293B" }}>סגירה מוקדמת / מחיקה</h4>
          <p className="text-sm" style={{ color: "#64748B" }}>
            ניתן לסגור סשן לפני הזמן או למחוק סשנים ישנים ממסך הסשנים.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "admin-items",
    title: "ניהול פריטים",
    content: (
      <div className="space-y-5">
        <div className="rounded-[12px] px-3 py-2 inline-flex items-center gap-1.5 mb-1" style={{ background: "#F0FDF4" }}>
          <Tag text="מנהל סביבה בלבד" color="#F0FDF4" textColor="#16A34A" />
        </div>
        <p className="text-sm" style={{ color: "#334155" }}>
          ממסך 'פריטים' בפאנל הניהול ניתן לנהל את רשימת הציוד שמשתמשים יוכלו להזמין.
        </p>
        <div className="space-y-2">
          {[
            "הוספת פריט — שם, יחידה (קופסה/יחידה/ק\"ג...) וקטגוריה",
            "עריכת פריט קיים",
            "הסתרת פריט — פריט מוסתר לא מוצג למשתמשים אבל נשמר במערכת",
            "קביעת סדר תצוגה — גרירה לסדר הרצוי",
          ].map((item, i) => (
            <Step key={i} num={i + 1} text={item} />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "admin-users",
    title: "ניהול משתמשים",
    content: (
      <div className="space-y-5">
        <div className="rounded-[12px] px-3 py-2 inline-flex items-center gap-1.5 mb-1" style={{ background: "#F0FDF4" }}>
          <Tag text="מנהל סביבה בלבד" color="#F0FDF4" textColor="#16A34A" />
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold mb-2" style={{ color: "#1E293B" }}>אישור משתמשים חדשים</h4>
            <p className="text-sm" style={{ color: "#64748B" }}>
              כשמשתמש מצטרף לסביבה שדורשת אישור — הוא מופיע בסטטוס 'ממתין'.
              ממסך ניהול החברים לוחצים 'אשר' להתיר לו להגיש הזמנות.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-2" style={{ color: "#1E293B" }}>חסימת משתמש</h4>
            <p className="text-sm" style={{ color: "#64748B" }}>
              משתמש חסום לא יוכל להגיש הזמנות. ניתן לבטל את החסימה בכל עת.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-2" style={{ color: "#1E293B" }}>שינוי הרשאה</h4>
            <p className="text-sm" style={{ color: "#64748B" }}>
              ניתן להפוך משתמש רגיל למנהל סביבה, ולהיפך.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "reports",
    title: "דוחות וסיכומים",
    content: (
      <div className="space-y-5">
        <div className="rounded-[12px] px-3 py-2 inline-flex items-center gap-1.5 mb-1" style={{ background: "#F0FDF4" }}>
          <Tag text="מנהל סביבה בלבד" color="#F0FDF4" textColor="#16A34A" />
        </div>
        <p className="text-sm" style={{ color: "#334155" }}>
          ממסך 'סיכום' בפאנל הניהול ניתן לראות:
        </p>
        <div className="space-y-2">
          <Step num={1} text="סך הכמויות הכוללות לכל פריט מכל המשתמשים." />
          <Step num={2} text="פירוט לפי משתמש — מי הזמין מה ובאיזה כמות." />
          <Step num={3} text="נתוני הסשן — שם, תאריכים, מספר מגישי הזמנות." />
        </div>
        <Tip text="ניתן לייצא את הדוח לקובץ PDF ישירות מהמסך." />
      </div>
    ),
  },
  {
    id: "troubleshoot",
    title: "תקלות נפוצות",
    content: (
      <div className="space-y-4">
        {[
          {
            problem: "לא מצליח להגיש הזמנה",
            solution: "כנראה שאין חלון הזמנה פתוח כרגע, או שהסשן הסתיים. פנו למנהל הסביבה.",
          },
          {
            problem: "לא רואה סביבה",
            solution: "ייתכן שהצטרפות לסביבה עדיין ממתינה לאישור מנהל, או שלא הצטרפתם אליה עדיין.",
          },
          {
            problem: "שכחתי קוד הזמנה",
            solution: "פנו למנהל הסביבה. הוא יכול לאחזר ולשלוח את הקוד מחדש.",
          },
          {
            problem: "הסביבה שיצרתי ממתינה לאישור",
            solution: "סביבה חדשה דורשת אישור Super Admin. בדרך כלל האישור מגיע תוך זמן קצר.",
          },
          {
            problem: "כפתור 'שלח הזמנה' אפור",
            solution: "ודאו שמלאתם לפחות כמות אחת גדולה מ-0, ושהסשן עדיין פתוח.",
          },
        ].map(({ problem, solution }) => (
          <div key={problem} className="rounded-[14px] p-4" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <p className="text-sm font-bold mb-1" style={{ color: "#1E293B" }}>⚡ {problem}</p>
            <p className="text-sm" style={{ color: "#64748B" }}>{solution}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "tips",
    title: "דגשים חשובים",
    content: (
      <div className="space-y-3">
        {[
          "סשנים נסגרים אוטומטית לפי השעה שהוגדרה — אין צורך בפעולה ידנית.",
          "ניתן לעדכן הזמנה כמה פעמים שרוצים כל עוד הסשן פתוח.",
          "משתמש חסום לא יכול להיכנס לסביבה ולא להגיש הזמנות.",
          "כל הנתונים נשמרים אוטומטית — אין צורך לשמור ידנית.",
          "המערכת עובדת בעברית ומותאמת לטלפון נייד.",
          "ניתן להיות חבר בכמה סביבות במקביל ולעבור ביניהן.",
        ].map((tip, i) => (
          <Tip key={i} text={tip} />
        ))}
      </div>
    ),
  },
];

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState("intro");

  const current = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];

  return (
    <div dir="rtl" style={{ background: "#F8FAFC", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Nav */}
      <header style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#3B82F6" }}>
              <svg width="13" height="13" fill="white" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/></svg>
            </div>
            <span className="text-sm font-bold" style={{ color: "#1E293B" }}>Matrix Supply</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/faq" className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ color: "#64748B" }}>שאלות נפוצות</Link>
            <Link href="/login" className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "#3B82F6", color: "#FFF" }}>כניסה</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="py-10 text-center px-4" style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}>
        <h1 className="text-3xl font-black mb-2" style={{ color: "#1E293B" }}>מדריך שימוש</h1>
        <p className="text-sm" style={{ color: "#64748B" }}>כל מה שצריך לדעת — שלב אחר שלב.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-[220px_1fr] gap-6">

          {/* Sidebar — desktop */}
          <aside className="hidden md:block">
            <nav className="sticky top-20 space-y-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className="w-full text-right px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: activeSection === s.id ? "#EFF6FF" : "transparent",
                    color: activeSection === s.id ? "#3B82F6" : "#64748B",
                    fontWeight: activeSection === s.id ? 700 : 500,
                  }}
                >
                  {s.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* Mobile section picker */}
          <div className="md:hidden">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              className="w-full text-sm px-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ height: "44px", borderRadius: "12px", border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#1E293B" }}
            >
              {SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <main>
            <div className="rounded-[20px] p-6 md:p-8" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
              <h2 className="text-xl font-black mb-6" style={{ color: "#1E293B" }}>{current.title}</h2>
              {current.content}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-4">
              {SECTIONS.findIndex((s) => s.id === activeSection) > 0 ? (
                <button
                  onClick={() => setActiveSection(SECTIONS[SECTIONS.findIndex((s) => s.id === activeSection) - 1].id)}
                  className="text-sm font-medium px-4 py-2 rounded-xl border"
                  style={{ color: "#64748B", borderColor: "#E2E8F0", background: "#FFFFFF" }}
                >
                  ← הקודם
                </button>
              ) : <div />}
              {SECTIONS.findIndex((s) => s.id === activeSection) < SECTIONS.length - 1 ? (
                <button
                  onClick={() => setActiveSection(SECTIONS[SECTIONS.findIndex((s) => s.id === activeSection) + 1].id)}
                  className="text-sm font-bold px-4 py-2 rounded-xl"
                  style={{ background: "#3B82F6", color: "#FFFFFF" }}
                >
                  הבא →
                </button>
              ) : (
                <Link href="/register" className="text-sm font-bold px-4 py-2 rounded-xl" style={{ background: "#3B82F6", color: "#FFFFFF" }}>
                  התחל עכשיו →
                </Link>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
