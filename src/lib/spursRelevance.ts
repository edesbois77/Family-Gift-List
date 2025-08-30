// src/lib/spursRelevance.ts

// Words that indicate Spurs
const TOTTENHAM_ALIASES = [
  "tottenham hotspur",
  "tottenham",
  "spurs",
  "thfc",
  "hotspur",
];

// Players / managers / places
const SPURS_PLAYERS_MANAGERS = [
  "ange postecoglou","postecoglou",
  "son heung-min","sonny","son",
  "james maddison","maddison",
  "richarlison",
  "dejan kulusevski","kulusevski",
  "cristian romero","romero",
  "destiny udogie","udogie",
  "micky van de ven","van de ven",
  "brennan johnson","brennan johnson",
  "rodrigo bentancur","bentancur",
  "giovani lo celso","lo celso",
  "pape sarr","sarr",
  "oliver skipp","skipp",
  "pierre-emile hojbjerg","hojbjerg",
  "fraser forster","forster",
  "guglielmo vicario","vicario",
  // legacy
  "harry kane","kane",
  "mauricio pochettino","pochettino",
  "white hart lane","tottenham hotspur stadium","north london derby",
];

// Domains that are Spurs-focused or commonly carry Spurs sections
const SPURS_DOMAINS = new Set<string>([
  "tottenhamhotspur.com",
  "spurs-web.com",
  "football.london",
  "teamtalk.com",
  "footballinsider247.com",
  "theboyhotspur.com",
  "hotspurhq.com",
  "football365.com",
]);

function normHost(h?: string | null) {
  if (!h) return "";
  const host = h.toLowerCase();
  return host.startsWith("www.") ? host.slice(4) : host;
}

function countMatches(text: string, needles: string[]) {
  const t = text.toLowerCase();
  let c = 0;
  for (const n of needles) if (t.includes(n)) c++;
  return c;
}

/**
 * Returns a score 0..100 for "about Tottenham".
 * Default threshold suggestion: >= 25 (while testing).
 */
export function spursRelevanceScore({
  title,
  summary,
  body,
  sourceDomain,
  articleUrl,
}: {
  title?: string;
  summary?: string;
  body?: string;
  sourceDomain?: string | null;  // from siteUrl or url hostname
  articleUrl?: string | null;    // full URL, to inspect path (e.g. /tottenham-hotspur/)
}): number {
  const titleText = (title || "").toLowerCase();
  const summaryText = (summary || "").toLowerCase();
  const bodyText = (body || "").toLowerCase();

  let score = 0;

  // 1) Domain prior
  const host = normHost(sourceDomain || "");
  if (host && SPURS_DOMAINS.has(host)) {
    score += 40;
  }

  // 2) URL path hints (helps sites like football.london team sections)
  try {
    if (articleUrl) {
      const u = new URL(articleUrl);
      const path = u.pathname.toLowerCase();
      if (
        path.includes("tottenham") ||
        path.includes("tottenham-hotspur") ||
        path.includes("/spurs/")
      ) {
        score += 25; // strong signal from the URL path
      }
    }
  } catch {
    // ignore bad urls
  }

  // 3) Title signals
  const titleClubHits = countMatches(titleText, TOTTENHAM_ALIASES);
  score += titleClubHits * 20;

  // 4) Lede (first 300 chars)
  const lede = bodyText.slice(0, 300);
  score += countMatches(lede, TOTTENHAM_ALIASES) * 8;

  // 5) Overall frequency, capped
  const totalClubMentions =
    countMatches(summaryText, TOTTENHAM_ALIASES) +
    countMatches(bodyText, TOTTENHAM_ALIASES);
  score += Math.min(totalClubMentions * 3, 18);

  // 6) Player/manager names
  const keyPeopleMentions =
    countMatches(titleText, SPURS_PLAYERS_MANAGERS) * 6 +
    countMatches(lede, SPURS_PLAYERS_MANAGERS) * 3 +
    Math.min(countMatches(bodyText, SPURS_PLAYERS_MANAGERS), 5) * 2;
  score += keyPeopleMentions;

  // 7) Penalty if only a single mention and none in title
  if (titleClubHits === 0 && totalClubMentions <= 1) {
    score -= 10;
  }

  // clamp
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return score;
}