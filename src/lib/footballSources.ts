// src/lib/footballSources.ts
export type SourceDef = {
  id: string;
  name: string;
  feed: string;
  domain?: string;
};

// Keep this list small to start. You can add more later.
export const FOOTBALL_SOURCES = [
  // general football
  { id: "bbc-football", name: "BBC Football", feed: "https://feeds.bbci.co.uk/sport/football/rss.xml", domain: "bbc.co.uk" },
  { id: "guardian-football", name: "The Guardian Football", feed: "https://www.theguardian.com/football/rss", domain: "theguardian.com" },
  { id: "sky-football", name: "Sky Sports Football", feed: "https://www.skysports.com/rss/12040/football", domain: "skysports.com" },

  // spurs-focused
  { id: "spurs-official", name: "Tottenham Hotspur Official", feed: "https://www.tottenhamhotspur.com/feeds/news.xml", domain: "tottenhamhotspur.com" },
  { id: "spurs-web", name: "The Spurs Web", feed: "https://www.spurs-web.com/feed/", domain: "spurs-web.com" },
  { id: "football-london-spurs", name: "Football London Spurs", feed: "https://www.football.london/all-about/tottenham-hotspur/?service=rss", domain: "football.london" },
  { id: "teamtalk-spurs", name: "TeamTalk Spurs", feed: "https://www.teamtalk.com/tottenham-hotspur/feed", domain: "teamtalk.com" },
  { id: "football-insider", name: "Football Insider", feed: "https://www.footballinsider247.com/feed/", domain: "footballinsider247.com" },
  { id: "boy-hotspur", name: "The Boy Hotspur", feed: "https://theboyhotspur.com/feed/", domain: "theboyhotspur.com" },
  { id: "hotspur-hq", name: "Hotspur HQ", feed: "https://hotspurhq.com/feed/", domain: "hotspurhq.com" },
  { id: "football365-spurs", name: "Football365 Spurs", feed: "https://www.football365.com/tottenham-hotspur/feed", domain: "football365.com" },
];