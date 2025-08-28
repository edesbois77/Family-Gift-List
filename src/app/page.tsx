"use client";

import { useEffect, useState } from "react";
import ArticleCard from "./components/ArticleCard";

type Article = {
  id: number;
  title: string;
  summary: string;
  url: string;
  publishedAt?: string;
  source: { name: string };
};

export default function Home() {
  const [items, setItems] = useState<Article[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  async function load(cursor?: number | null) {
    setLoading(true);
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", String(cursor));
    const res = await fetch(`/api/articles?${params.toString()}`, { cache: "no-store" });
    const data = await res.json();
    const newItems: Article[] = data.items || [];
    setItems((prev) => (cursor ? [...prev, ...newItems] : newItems));
    setNextCursor(data.nextCursor ?? null);
    setLoading(false);
  }

  async function fetchNow() {
    setFetching(true);
    try {
      const res = await fetch("/api/fetch", { method: "POST" });
      const data = await res.json();
      // reload feed after fetch
      await load(null);
      alert(`Fetched, added ${data.added} new articles`);
    } catch (e) {
      alert("Fetch failed");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    load(null);
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Scouted, prototype</h1>
        <button
          onClick={fetchNow}
          disabled={fetching}
          className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {fetching ? "Fetching..." : "Fetch new stories"}
        </button>
      </header>

      <section className="space-y-4">
        {items.map((a) => (
          <ArticleCard
            key={a.id}
            title={a.title}
            summary={a.summary}
            url={a.url}
            source={a.source.name}
            publishedAt={a.publishedAt}
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
