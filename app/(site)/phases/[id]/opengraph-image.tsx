import { ImageResponse } from "next/og";
import { allTools, phases } from "@/lib/data";
import { OG_COLORS, phaseHex } from "@/lib/og";
import { phaseCountLine, phasePage, phaseTitle } from "@/lib/phase-page";

export const alt = "A lifecycle phase in the AI SDLC Landscape";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return phases().map((p) => ({ id: p.id }));
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = phasePage(id, phases(), allTools());
  const names = page ? page.primary.slice(0, 8).map((t) => t.name) : [];

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
          borderTop: page ? `16px solid ${phaseHex(page.phase.id)}` : undefined,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 26, color: OG_COLORS.muted }}>AI SDLC Landscape</div>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700, marginTop: 24, letterSpacing: -2 }}>
            {page ? phaseTitle(page.phase) : "Phase not found"}
          </div>
          <div style={{ display: "flex", fontSize: 34, color: OG_COLORS.muted, marginTop: 16 }}>
            {page ? phaseCountLine(page) : ""}
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 28 }}>
          {names.map((name) => (
            <div key={name} style={{ display: "flex", padding: "8px 16px", borderRadius: 8, background: OG_COLORS.track }}>
              {name}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
