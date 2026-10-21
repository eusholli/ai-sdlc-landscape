import { ImageResponse } from "next/og";
import { allTools, phases, relations, toolsByPhase } from "@/lib/data";
import { OG_COLORS, phaseHex } from "@/lib/og";

export const alt = "AI SDLC Landscape: AI tools across the 13 phases of the software lifecycle";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const toolCount = allTools().filter((t) => t.kind === "tool").length;
  const phaseList = phases();
  const grouped = toolsByPhase();
  const counts = phaseList.map((p) => grouped[p.id].length);
  const max = Math.max(...counts, 1);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 56,
          background: OG_COLORS.background,
          color: OG_COLORS.ink,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 28, color: OG_COLORS.muted }}>
            A neutral public map of AI in the software lifecycle
          </div>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700, marginTop: 12, letterSpacing: -2 }}>
            AI SDLC Landscape
          </div>
          <div style={{ display: "flex", fontSize: 34, color: OG_COLORS.muted, marginTop: 12 }}>
            {`${toolCount} tools, ${phaseList.length} phases, ${relations().length} relations`}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", width: "100%", gap: 6 }}>
          {phaseList.map((phase, index) => (
            <div key={phase.id} style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
              <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>{counts[index]}</div>
              <div
                style={{
                  display: "flex",
                  height: 36 + Math.round((counts[index] / max) * 150),
                  background: phaseHex(phase.id),
                  borderRadius: 4,
                }}
              />
              <div style={{ display: "flex", fontSize: 14, color: OG_COLORS.ink }}>
                {phase.label.split(" and ")[0]}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
