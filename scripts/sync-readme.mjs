// Regenerates the "Live now" section of README.md from the portfolio's
// public build log (lib/projects.ts, served as JSON). Run weekly by
// .github/workflows/sync-readme.yml; safe to run locally too.

import { readFileSync, writeFileSync } from "node:fs";

const SOURCE = "https://mohameddewidar.com/api/projects";
const README = new URL("../README.md", import.meta.url);
const START = "<!-- LIVE:START -->";
const END = "<!-- LIVE:END -->";

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`${SOURCE} responded ${res.status}`);
const { projects } = await res.json();

// Endpoint returning [] almost certainly means a bug upstream, not a
// portfolio with zero shipped products. Fail loudly instead of blanking.
const live = projects.filter((p) => p.status === "live");
if (live.length === 0) throw new Error("0 live projects; refusing to update");

const lines = live.map((p) => {
  const name = p.liveUrl ? `[${p.title}](${p.liveUrl})` : p.title;
  return `- **${name}**: ${p.description}`;
});

const readme = readFileSync(README, "utf8");
const start = readme.indexOf(START);
const end = readme.indexOf(END);
if (start === -1 || end === -1 || end < start) {
  throw new Error("README markers missing or malformed");
}

const next =
  readme.slice(0, start + START.length) +
  "\n" +
  lines.join("\n") +
  "\n" +
  readme.slice(end);

if (next === readme) {
  console.log("No changes");
} else {
  writeFileSync(README, next);
  console.log(`Updated: ${live.length} live projects`);
}
