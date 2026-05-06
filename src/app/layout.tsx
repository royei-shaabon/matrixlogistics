import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "הזמנת אספקה - מטריקס",
  description: "מערכת הגשת בקשות לוגיסטיות לעובדי מטריקס",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className="min-h-full" style={{ background: "#F9FBFD" }}>{children}</body>
    </html>
  );
}
