"use client";

import { useEffect, useState } from "react";
import ArticleCard from "./components/ArticleCard";

type Article = {
  id: number;
  title: string;
  summary: string;
  url: string;
  imageUrl?: string;
  publishedAt?: string;
  source: { name: string };
};

type ClubFilter = "all" | "tottenham";

export default function Home() {
  const [items, setItems] = useState<Article[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [club, setClub] = useState<ClubFilter>("tottenham"); // default to Tottenham

  async function load(cursor?: number | null, reset = false) {
    setLoading(true);
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", String(cursor));
    if (club === "tottenham") params.set("club", "tottenham");

    const res = await fetch(`/api/articles?${params.toString()}`, { cache: "no-store" });
    const data = await res.json();

    const newItems: Article[] = data.items || data.articles || [];
    setItems((prev) => (reset || !cursor ? newItems : [...prev, ...newItems]));
    setNextCursor(data.nextCursor ?? null);
    setLoading(false);
  }

  async function fetchNow() {
    setFetching(true);
    try {
      const res = await fetch("/api/fetch", { method: "POST" });
      const data = await res.json();
      await load(null, true); // reload from the top
      alert(`Fetched, added ${data.added ?? 0} new articles`);
    } catch (e) {
      alert("Fetch failed");
    } finally {
      setFetching(false);
    }
  }

  // initial load
  useEffect(() => {
    load(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload when the club filter changes
  useEffect(() => {
    load(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Scouted, prototype</h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border overflow-hidden">
            <button
              onClick={() => setClub("all")}
              className={`px-3 py-2 text-sm ${
                club === "all" ? "bg-black text-white" : "bg-white"
              }`}
              aria-pressed={club === "all"}
            >
              All football
            </button>
            <button
              onClick={() => setClub("tottenham")}
              className={`px-3 py-2 text-sm ${
                club === "tottenham" ? "bg-black text-white" : "bg-white"
              }`}
              aria-pressed={club === "tottenham"}
            >
              Tottenham only
            </button>
          </div>

          <button
            onClick={fetchNow}
            disabled={fetching}
            className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {fetching ? "Fetching..." : "Fetch new stories"}
          </button>
        </div>
      </header>

      <section className="space-y-4">
        {items.map((a) => (
          <ArticleCard
            key={a.id}
            title={a.title}
            summary={a.summary}
            url={a.url}
            source={a.source?.name || ""}
            publishedAt={a.publishedAt}
            imageUrl={a.imageUrl}
          />
        ))}
      </section>

      <div className="mt-6 flex justify-center">
        {nextCursor && (
          <button
            onClick={() => load(nextCursor)}
            disabled={loading}
            className="rounded-xl border px-4 py-2"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </main>
  );
}
