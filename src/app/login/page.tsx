"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);
    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      const token = await credential.user.getIdToken();
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "שגיאה בכניסה עם גוגל"); return; }
      if (data.needsRegistration) { router.push("/complete-registration"); return; }
      if (data.role === "admin") router.push("/admin");
      else if (data.status === "pending") router.push("/pending");
      else router.push("/order");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      if (code === "auth/account-exists-with-different-credential") {
        setError("חשבון עם מייל זה כבר קיים עם סיסמה. אנא היכנס עם מייל וסיסמה.");
      } else {
        setError("שגיאה בכניסה עם גוגל, נסה שנית");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const token = await credential.user.getIdToken();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "שגיאה בכניסה"); return; }
      if (data.role === "admin") router.push("/admin");
      else if (data.status === "pending") router.push("/pending");
      else router.push("/order");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        setError("מייל או סיסמה שגויים");
      } else {
        setError("שגיאה בכניסה, נסה שנית");
      }
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
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>מטריקס</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>מערכת הגשת בקשות לוגיסטיות</p>
        </div>

        {/* Card */}
        <div
          className="bg-white p-6 rounded-[18px]"
          style={{ boxShadow: "0px 4px 12px rgba(15,23,42,0.06)", border: "1px solid #DCE7F3" }}
        >
          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 font-semibold text-sm border transition-all"
            style={{
              height: "52px",
              borderRadius: "14px",
              borderColor: "#DCE7F3",
              background: googleLoading ? "#F8FAFC" : "#FFFFFF",
              color: "#1E293B",
              opacity: googleLoading ? 0.7 : 1,
            }}
          >
            {googleLoading ? (
              <span style={{ color: "#94A3B8" }}>מתחבר...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                כניסה עם Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "#DCE7F3" }} />
            <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>או</span>
            <div className="flex-1 h-px" style={{ background: "#DCE7F3" }} />
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#1E293B" }}>כתובת מייל</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                style={{ height: "52px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#1E293B" }}>סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
                style={{ height: "52px", borderRadius: "12px", borderColor: "#DCE7F3", background: "#F8FAFC" }}
              />
            </div>

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
              disabled={loading || googleLoading}
              className="w-full text-white font-semibold text-sm transition-all"
              style={{ height: "52px", borderRadius: "14px", background: loading ? "#93C5FD" : "#3B82F6" }}
            >
              {loading ? "מתחבר..." : "כניסה"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "#64748B" }}>
          משתמש חדש?{" "}
          <Link href="/register" className="font-semibold" style={{ color: "#3B82F6" }}>
            הרשמה
          </Link>
        </p>
      </div>
    </div>
  );
}
