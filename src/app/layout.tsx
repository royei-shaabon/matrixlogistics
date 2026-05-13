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
  title: "הזמנת אספקה - Get Supply",
  description: "מערכת הגשת בקשות לוגיסטיות Get Supply",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
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
    title: "Get Supply",
    description: "מערכת הגשת בקשות לוגיסטיות",
    url: "https://get-supply.web.app",
    siteName: "Get Supply",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "Get Supply" }],
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`h-full ${heebo.className}`}>
      <body className="min-h-full" style={{ background: "#F9FBFD" }}>{children}</body>
    </html>
  );
}
