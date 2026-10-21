// Placeholder until v0 step 2 builds the map. Shows the data layer is wired.
import { allTools, dataDate, phases, toolsByPhase } from "@/lib/data";

export default function Home() {
  const byPhase = toolsByPhase();
  const tools = allTools().filter((t) => t.kind === "tool");
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">AI SDLC Landscape</h1>
      <p className="text-muted-foreground mt-2">
        {tools.length} tools across {phases().length} phases. Data as of {dataDate()}.
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {phases().map((p) => (
          <li key={p.id} className="rounded-md border p-3">
            <div className="font-medium">{p.label}</div>
            <div className="text-muted-foreground text-sm">{byPhase[p.id].length} tools</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
