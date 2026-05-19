import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Get Supply — מערכת הזמנות ציוד";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Background circles */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(59,130,246,0.1)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(59,130,246,0.08)", display: "flex" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "#3B82F6",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="white">
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM4 5h16V4a1 1 0 00-1-1H5a1 1 0 00-1 1v1z"/>
            </svg>
          </div>
          <span style={{ fontSize: 32, fontWeight: 800, color: "#F1F5F9", letterSpacing: -0.5 }}>
            Get Supply
          </span>
        </div>

        {/* Main headline */}
        <div style={{
          fontSize: 52, fontWeight: 900, color: "#FFFFFF",
          textAlign: "center", lineHeight: 1.2,
          marginBottom: 20, maxWidth: 800,
        }}>
          מנהלים הזמנות ציוד בצורה מסודרת
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 24, color: "#94A3B8",
          textAlign: "center", maxWidth: 700, lineHeight: 1.5,
          marginBottom: 48,
        }}>
          בלי וואטסאפ, בלי אקסלים, בלי בלאגן
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 12 }}>
          {["חלונות הזמנה", "ניהול משתמשים", "דוחות מסכמים"].map((label) => (
            <div
              key={label}
              style={{
                padding: "10px 20px", borderRadius: 40,
                background: "rgba(59,130,246,0.2)",
                border: "1px solid rgba(59,130,246,0.4)",
                color: "#93C5FD", fontSize: 18, fontWeight: 600,
                display: "flex",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{ position: "absolute", bottom: 32, color: "#475569", fontSize: 16 }}>
          get-supply.web.app
        </div>
      </div>
    ),
    { ...size }
  );
}
