export type SourceDef = {
  id: string;
  name: string;
  feed: string;
  domain?: string;
};

// A few general football sources plus Spurs-focused
export const SOURCES: SourceDef[] = [
  { id: "fl_spurs", name: "Football.London Spurs", feed: "https://www.football.london/all-about/tottenham-hotspur.fc.rss", domain: "football.london" },
  { id: "spursweb", name: "The Spurs Web", feed: "https://www.spurs-web.com/feed/", domain: "spurs-web.com" },
  { id: "hotspurhq", name: "Hotspur HQ", feed: "https://hotspurhq.com/feed/", domain: "hotspurhq.com" },
  { id: "cfc", name: "Cartilage Free Captain", feed: "https://cartilagefreecaptain.sbnation.com/rss/index.xml", domain: "cartilagefreecaptain.com" },

  // broader football to test filtering
  { id: "guardian_football", name: "Guardian Football", feed: "https://www.theguardian.com/football/rss", domain: "theguardian.com" },
  { id: "bbc_football", name: "BBC Football", feed: "http://feeds.bbci.co.uk/sport/football/rss.xml?edition=uk", domain: "bbc.co.uk" },
];
