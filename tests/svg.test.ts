import { describe, expect, it } from "vitest";
import { lightOnly } from "@/scripts/svg";

describe("lightOnly", () => {
  it("drops dark-mode blocks, nested rules and all, and keeps the rest", () => {
    const svg = `<svg><style>
    path { fill: #000; }
    @media (prefers-color-scheme: dark) {
      path { fill: #fff; }
      circle { fill: #eee; }
    }
    @media(prefers-color-scheme:dark){:root{color:#f2f2f2}}
    @media (prefers-color-scheme: light) { :root { filter: none; } }
  </style><path d="M0 0"/></svg>`;
    const out = lightOnly(svg);
    expect(out).not.toMatch(/dark/);
    expect(out).not.toMatch(/#fff|#eee|#f2f2f2/);
    expect(out).toContain("path { fill: #000; }");
    expect(out).toContain("prefers-color-scheme: light");
    expect(out).toContain('<path d="M0 0"/></svg>');
  });

  it("leaves an SVG without dark rules unchanged", () => {
    const svg = '<svg><rect width="1" height="1"/></svg>';
    expect(lightOnly(svg)).toBe(svg);
  });
});
