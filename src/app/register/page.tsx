"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";

const FIELDS = [
  { name: "email", label: "כתובת מייל", type: "email", placeholder: "your@email.com" },
  { name: "name", label: "שם מלא", type: "text", placeholder: "ישראל ישראלי" },
  { name: "branch", label: "ענף", type: "text", placeholder: "שם הענף" },
  { name: "department", label: "מדור", type: "text", placeholder: "שם המדור" },
  { name: "password", label: "סיסמה", type: "password", placeholder: "לפחות 6 תווים" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", name: "", branch: "", department: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const token = await credential.user.getIdToken();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: form.name, branch: form.branch, department: form.department }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "שגיאה בהרשמה"); return; }
      if (data.role === "admin") router.push("/admin");
      else if (data.status === "pending") router.push("/pending");
      else router.push("/order");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-in-use") setError("כתובת מייל כבר קיימת במערכת");
      else if (code === "auth/weak-password") setError("הסיסמה חלשה מדי — לפחות 6 תווים");
      else setError("שגיאה בהרשמה, נסה שנית");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F9FBFD" }}>
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "#3B82F6" }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>הרשמה</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>מלא את הפרטים לקבלת גישה למערכת</p>
        </div>

        {/* Card */}
        <div
          className="bg-white p-6 rounded-[18px]"
          style={{ boxShadow: "0px 4px 12px rgba(15,23,42,0.06)", border: "1px solid #DCE7F3" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {FIELDS.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1E293B" }}>{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  required
                  minLength={field.name === "password" ? 6 : 1}
                  placeholder={field.placeholder}
                  className="w-full border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                  style={{ height: "52px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
                />
              </div>
            ))}

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold text-sm transition-all"
              style={{ height: "52px", borderRadius: "14px", background: loading ? "#93C5FD" : "#3B82F6" }}
            >
              {loading ? "שולח..." : "הרשמה"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "#64748B" }}>
          כבר רשום?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "#3B82F6" }}>
            כניסה
          </Link>
        </p>
      </div>
    </div>
  );
}
