export type SourceSeed = {
  name: string;
  rssUrl: string;
  siteUrl: string;
};

export const SOURCES: SourceSeed[] = [
  {
    name: "BBC Sport, Football",
    rssUrl: "https://feeds.bbci.co.uk/sport/football/rss.xml",
    siteUrl: "https://www.bbc.co.uk/sport/football",
  },
  {
    name: "The Guardian, Football",
    rssUrl: "https://www.theguardian.com/football/rss",
    siteUrl: "https://www.theguardian.com/football",
  },
  {
    name: "Sky Sports, Football",
    rssUrl: "https://www.skysports.com/rss/12040",
    siteUrl: "https://www.skysports.com/football",
  },
];
