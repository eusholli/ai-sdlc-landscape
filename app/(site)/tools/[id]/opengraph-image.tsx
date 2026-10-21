import { ImageResponse } from "next/og";
import { allTools, layers, phases, toolById } from "@/lib/data";
import { OG_COLORS, phaseHex, truncate } from "@/lib/og";

export const alt = "A tool in the AI SDLC Landscape";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return allTools().map((t) => ({ id: t.id }));
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tool = toolById(id);
  const phaseList = phases();
  const covered = new Set<string>(tool?.phases ?? []);
  const layerLabel = tool?.layer ? layers().find((l) => l.id === tool.layer)?.label : null;
  const coverage = layerLabel
    ? `${layerLabel}, a cross-cutting layer`
    : `Covers ${covered.size} of ${phaseList.length} phases`;

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
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, marginTop: 24, letterSpacing: -2 }}>
            {tool?.name ?? "Tool not found"}
          </div>
          <div style={{ display: "flex", fontSize: 36, color: OG_COLORS.muted, marginTop: 4 }}>
            {tool?.company ?? ""}
          </div>
          <div style={{ display: "flex", fontSize: 34, lineHeight: 1.35, marginTop: 36, maxWidth: 1000 }}>
            {tool?.summary
              ? `\u201C${truncate(tool.summary, 150)}\u201D`
              : "The vendor has not published a one-line claim."}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", width: "100%", gap: 6 }}>
            {phaseList.map((phase) => (
              <div
                key={phase.id}
                style={{
                  display: "flex",
                  flex: 1,
                  height: 28,
                  borderRadius: 4,
                  background: covered.has(phase.id) ? phaseHex(phase.id) : OG_COLORS.track,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: OG_COLORS.muted }}>{coverage}</div>
        </div>
      </div>
    ),
    size,
  );
}
