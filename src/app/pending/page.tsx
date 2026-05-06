"use client";

import { useRouter } from "next/navigation";

export default function PendingPage() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">ממתין לאישור מנהל</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          פרטיך נשמרו בהצלחה. המנהל יאשר את גישתך בהקדם.
          <br />
          לאחר האישור תוכל להתחבר ולהגיש הזמנה.
        </p>
        <button
          onClick={handleLogout}
          className="mt-8 text-sm text-gray-400 hover:text-gray-600 underline"
        >
          יציאה מהמערכת
        </button>
      </div>
    </div>
  );
}
