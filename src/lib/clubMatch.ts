// src/lib/clubMatch.ts
// Super simple string match for Tottenham, good enough to start.
// We limit false "Spurs" hits by only ingesting football sources in Step 2.
const TOTTENHAM_ALIASES = [
  "tottenham hotspur",
  "tottenham",
  "spurs",
  "thfc",
  "tottenham’s",
  "spurs’",
  "hotspur",
];

export function isTottenham(text: string | null | undefined): boolean {
  if (!text) return false;
  const t = text.toLowerCase();

  // quick pass
  if (TOTTENHAM_ALIASES.some(a => t.includes(a))) return true;

  return false;
}