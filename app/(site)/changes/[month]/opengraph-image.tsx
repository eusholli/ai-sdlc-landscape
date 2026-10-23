import { ImageResponse } from "next/og";
import { digest, digestFacts, digestMonths } from "@/lib/digest";
import { OG_COLORS, phaseHex, truncate } from "@/lib/og";

export const alt = "A monthly digest of the AI SDLC Landscape";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return digestMonths().map((month) => ({ month }));
}

export default async function Image({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  const known = digestMonths().includes(month);
  const d = known ? digest(month) : null;
  const facts = d ? digestFacts(d).slice(0, 3) : [];

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
          <div style={{ display: "flex", fontSize: 28, color: OG_COLORS.muted, marginTop: 24 }}>The landscape in</div>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>
            {d?.title ?? "Month not found"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 28, maxWidth: 1050 }}>
            {facts.map((fact) => (
              <div key={fact} style={{ display: "flex", fontSize: 30, lineHeight: 1.3 }}>
                {truncate(fact, 110)}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", width: "100%", gap: 6 }}>
          {d && d.phases.length > 0 ? (
            d.phases.map((phase) => (
              <div
                key={phase.id}
                style={{ display: "flex", flexGrow: phase.added, flexBasis: 0, height: 20, borderRadius: 4, background: phaseHex(phase.id) }}
              />
            ))
          ) : (
            <div style={{ display: "flex", flex: 1, height: 20, borderRadius: 4, background: OG_COLORS.track }} />
          )}
        </div>
      </div>
    ),
    size,
  );
}
