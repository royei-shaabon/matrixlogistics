import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://get-supply.web.app"),
  title: "Get Supply — מערכת הזמנות ציוד",
  description: "אפליקציה לאיסוף וניהול לוגיסטיקה",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
    shortcut: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Get Supply",
  },
  openGraph: {
    title: "Get Supply — מערכת הזמנות ציוד",
    description: "אפליקציה לאיסוף וניהול לוגיסטיקה",
    url: "https://get-supply.web.app",
    siteName: "Get Supply",
    locale: "he_IL",
    type: "website",
    images: [
      {
        url: "https://get-supply.web.app/icon.png",
        width: 512,
        height: 512,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Get Supply — מערכת הזמנות ציוד",
    description: "אפליקציה לאיסוף וניהול לוגיסטיקה",
    images: ["https://get-supply.web.app/icon.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`h-full ${heebo.className}`}>
      <body className="min-h-full" style={{ background: "#F9FBFD" }}>{children}</body>
    </html>
  );
}
