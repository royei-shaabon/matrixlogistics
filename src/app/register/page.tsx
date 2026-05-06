"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    name: "",
    branch: "",
    department: "",
    password: "",
  });
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

      if (!res.ok) {
        setError(data.error || "שגיאה בהרשמה");
        return;
      }

      if (data.role === "admin") router.push("/admin");
      else if (data.status === "pending") router.push("/pending");
      else router.push("/order");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-in-use") {
        setError("כתובת מייל כבר קיימת במערכת");
      } else if (code === "auth/weak-password") {
        setError("הסיסמה חלשה מדי — לפחות 6 תווים");
      } else {
        setError("שגיאה בהרשמה, נסה שנית");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">הרשמה למערכת</h1>
          <p className="text-gray-500 mt-1 text-sm">מלא את הפרטים לקבלת גישה</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "email", label: "כתובת מייל", type: "email", placeholder: "your@email.com" },
            { name: "name", label: "שם מלא", type: "text", placeholder: "ישראל ישראלי" },
            { name: "branch", label: "ענף", type: "text", placeholder: "שם הענף" },
            { name: "department", label: "מדור", type: "text", placeholder: "שם המדור" },
            { name: "password", label: "סיסמה", type: "password", placeholder: "לפחות 6 תווים" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                required
                minLength={field.name === "password" ? 6 : 1}
                placeholder={field.placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? "שולח..." : "הרשמה"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          כבר רשום?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            כניסה
          </Link>
        </p>
      </div>
    </div>
  );
}
