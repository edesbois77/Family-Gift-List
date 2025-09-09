"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function AddGiftForm({ listId }: { listId: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    try {
      const res = await fetch(`/api/lists/${listId}/gifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed ${res.status}`);
      }

      form.reset();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
      ) : null}

      <div>
        <label className="block text-sm font-medium">Title *</label>
        <input
          name="title"
          required
          className="mt-1 w-full rounded-md border px-3 py-2"
          placeholder="e.g. Lego Star Wars"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          name="description"
          rows={2}
          className="mt-1 w-full rounded-md border px-3 py-2"
          placeholder="Notes about color, model, etc."
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Product URL</label>
        <input
        name="productUrl"                 // <-- was "url"
        type="url"
        className="mt-1 w-full rounded-md border px-3 py-2"
        placeholder="https://store.example.com/item"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Image URL</label>
        <input
          name="imageUrl"
          type="url"
          className="mt-1 w-full rounded-md border px-3 py-2"
          placeholder="https://images.example.com/item.jpg"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Price</label>
          <input
            name="price"
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="29.99"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Delivery Cost</label>
          <input
            name="deliveryCost"
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="3.50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Size</label>
          <input
            name="size"
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="M, UK 7, 128cm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Notes</label>
          <input
            name="notes"
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="Preferred color blue"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Gift"}
      </button>
    </form>
  );
}