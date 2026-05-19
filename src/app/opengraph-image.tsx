import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Get Supply — אפליקציה לאיסוף וניהול לוגיסטיקה";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://get-supply.web.app";
  const iconRes = await fetch(`${baseUrl}/icon.png`);
  const iconBuffer = await iconRes.arrayBuffer();
  const iconBase64 = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(iconBuffer)))}`;

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
          background: "#FFFFFF",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Icon */}
        <img
          src={iconBase64}
          width={140}
          height={140}
          style={{ borderRadius: 32, marginBottom: 28 }}
        />

        {/* App name */}
        <div style={{ fontSize: 56, fontWeight: 900, color: "#1E293B", marginBottom: 16, display: "flex" }}>
          Get Supply
        </div>

        {/* Description */}
        <div style={{ fontSize: 28, color: "#64748B", display: "flex" }}>
          אפליקציה לאיסוף וניהול לוגיסטיקה
        </div>
      </div>
    ),
    { ...size }
  );
}
