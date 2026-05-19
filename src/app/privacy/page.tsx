import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "מדיניות פרטיות | Get Supply",
  description: "מדיניות הפרטיות של Get Supply",
};

export default function PrivacyPage() {
  return (
    <div dir="rtl" style={{ background: "#F8FAFC", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Nav */}
      <header style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon.png" alt="Get Supply" width={28} height={28} className="rounded-lg" />
            <span className="text-sm font-bold" style={{ color: "#1E293B" }}>Get Supply</span>
          </Link>
          <Link href="/login" className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: "#3B82F6", color: "#FFF" }}>כניסה</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12 pb-20">
        <h1 className="text-3xl font-black mb-2" style={{ color: "#1E293B" }}>מדיניות פרטיות</h1>
        <p className="text-sm mb-10" style={{ color: "#94A3B8" }}>עדכון אחרון: ינואר 2026</p>

        <div className="space-y-8">

          <section className="rounded-[20px] p-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#1E293B" }}>1. מי אנחנו</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
              Get Supply היא מערכת לניהול הזמנות ציוד, המופעלת על ידי Royei Villiam Shaabon.
              שירות זה נועד לסייע לארגונים ויחידות לנהל הזמנות ציוד בצורה מסודרת ומרוכזת.
            </p>
          </section>

          <section className="rounded-[20px] p-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#1E293B" }}>2. מידע שאנו אוספים</h2>
            <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#64748B" }}>
              <p>אנו אוספים את הפרטים הבאים בעת הרשמה ושימוש בשירות:</p>
              <ul className="space-y-2 pr-4">
                <li style={{ listStyleType: "disc" }}>שם מלא ומספר טלפון</li>
                <li style={{ listStyleType: "disc" }}>כתובת דואר אלקטרוני</li>
                <li style={{ listStyleType: "disc" }}>נתוני הזמנות שהוגשו דרך המערכת</li>
                <li style={{ listStyleType: "disc" }}>מידע על הסביבות שבהן אתם חברים</li>
              </ul>
              <p>איננו אוספים מידע פיננסי ואיננו שומרים פרטי תשלום.</p>
            </div>
          </section>

          <section className="rounded-[20px] p-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#1E293B" }}>3. כיצד אנו משתמשים במידע</h2>
            <div className="space-y-2 text-sm leading-relaxed" style={{ color: "#64748B" }}>
              <ul className="space-y-2 pr-4">
                <li style={{ listStyleType: "disc" }}>הפעלת השירות ואימות זהות המשתמש</li>
                <li style={{ listStyleType: "disc" }}>הצגת הזמנות ודוחות למנהלי סביבות</li>
                <li style={{ listStyleType: "disc" }}>שיפור ופיתוח השירות</li>
                <li style={{ listStyleType: "disc" }}>תקשורת הכרחית הקשורה לחשבונכם</li>
              </ul>
              <p className="mt-3">איננו מוכרים, מעבירים או משכירים את פרטיכם לצדדים שלישיים.</p>
            </div>
          </section>

          <section className="rounded-[20px] p-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#1E293B" }}>4. אחסון ואבטחת מידע</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
              הנתונים מאוחסנים בשירותי Google (Firebase / Firestore) ב-Google Cloud, עם הצפנה בשידור ובמנוחה.
              אנו נוקטים אמצעי אבטחה סבירים להגנה על המידע. עם זאת, אין אנו יכולים להבטיח אבטחה מוחלטת.
            </p>
          </section>

          <section className="rounded-[20px] p-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#1E293B" }}>5. Cookies וזיהוי משתמש</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
              השירות משתמש בעוגיית session להזדהות מאובטחת. העוגייה אינה מכילה מידע אישי ומשמשת אך ורק לאימות הכניסה.
              לא נעשה שימוש בעוגיות מעקב או פרסומיות.
            </p>
          </section>

          <section className="rounded-[20px] p-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#1E293B" }}>6. זכויות המשתמש</h2>
            <div className="space-y-2 text-sm leading-relaxed" style={{ color: "#64748B" }}>
              <p>בהתאם לחוק, יש לכם הזכות:</p>
              <ul className="space-y-2 pr-4">
                <li style={{ listStyleType: "disc" }}>לעיין במידע שנשמר עליכם</li>
                <li style={{ listStyleType: "disc" }}>לבקש תיקון של מידע שגוי</li>
                <li style={{ listStyleType: "disc" }}>לבקש מחיקת חשבונכם</li>
              </ul>
              <p className="mt-3">לפניות בנושא פרטיות, צרו קשר עם מנהל הסביבה שלכם.</p>
            </div>
          </section>

          <section className="rounded-[20px] p-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#1E293B" }}>7. שינויים במדיניות</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>
              אנו שומרים לעצמנו את הזכות לעדכן מדיניות זו. שינויים מהותיים יובאו לידיעת המשתמשים בהודעה מתאימה.
              המשך השימוש בשירות לאחר שינוי מהווה הסכמה למדיניות המעודכנת.
            </p>
          </section>

        </div>

        <p className="text-xs text-center mt-10" style={{ color: "#CBD5E1" }}>
          כל הזכויות שמורות לRoyei Villiam Shaabon 2026
        </p>
      </div>
    </div>
  );
}
