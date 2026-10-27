import { ImageResponse } from "next/og";
import { markBars, OG_COLORS } from "@/lib/og";

// The home screen icon. iOS fills transparency with black, so the mark sits on the page colour.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", background: OG_COLORS.background }}>
        {markBars(size.width, 36).map((b) => (
          <div
            key={b.color}
            style={{
              position: "absolute",
              left: b.x,
              top: b.y,
              width: b.width,
              height: b.height,
              borderRadius: b.width / 3,
              background: b.color,
            }}
          />
        ))}
      </div>
    ),
    size,
  );
}
