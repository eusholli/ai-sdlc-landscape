import { ImageResponse } from "next/og";
import { OG_COLORS } from "@/lib/og";

export const alt = "Software ownership, the software factory and factory engineering: the thesis, from the AI SDLC Landscape";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 64,
          background: OG_COLORS.background,
          color: OG_COLORS.ink,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 26, color: OG_COLORS.muted }}>AI SDLC Landscape</div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, marginTop: 24, letterSpacing: -2 }}>
            Software ownership
          </div>
          <div style={{ display: "flex", fontSize: 34, lineHeight: 1.35, marginTop: 36, maxWidth: 1000 }}>
            The software factory, factory engineering and accountability in agentic software development.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: OG_COLORS.muted }}>Geoff Hollingworth, maintainer</div>
      </div>
    ),
    size,
  );
}
