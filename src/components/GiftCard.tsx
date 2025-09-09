"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Gift = {
  id: string;
  title: string;
  description: string | null;
  productUrl: string | null;
  imageUrl: string | null;
  price: number | null;
  deliveryCost: number | null;
  size: string | null;
  priority: number | null;      // rating 1–10
  createdAt?: string | Date;
  updatedAt?: string | Date;    // will show “Last edited” if present
};

export default function GiftCard({ gift }: { gift: Gift }) {
  const router = useRouter();

  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({
    title: gift.title ?? "",
    description: gift.description ?? "",
    productUrl: gift.productUrl ?? "",
    imageUrl: gift.imageUrl ?? "",
    price: gift.price ?? "",
    deliveryCost: gift.deliveryCost ?? "",
    size: gift.size ?? "",
    priority: gift.priority ?? 5,
  });
  const [error, setError] = React.useState<string | null>(null);

  const lastEdited = gift.updatedAt
    ? new Date(gift.updatedAt).toLocaleString()
    : gift.createdAt
    ? new Date(gift.createdAt).toLocaleString()
    : "";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch(`/api/gifts/${gift.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || `Save failed ${res.status}`);
      return;
    }

    setEditing(false);
    router.refresh();
  }

  // ---- VIEW MODE ----
  if (!editing) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{gift.title}</h3>
            {gift.description ? (
              <p className="text-sm text-gray-600 mt-1">{gift.description}</p>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-lg font-semibold text-gray-900">
                {gift.price != null ? `£${Number(gift.price).toFixed(2)}` : "£—"}
              </span>
              {gift.deliveryCost != null ? (
                <span className="text-lg font-semibold text-gray-900">
                  Delivery £{Number(gift.deliveryCost).toFixed(2)}
                </span>
              ) : null}
              {gift.size ? <span className="text-sm text-gray-600">Size: {gift.size}</span> : null}
              {typeof gift.priority === "number" ? (
                <span className="text-sm text-gray-600">Rating: {gift.priority}/10</span>
              ) : null}
            </div>

            {gift.productUrl ? (
              <a
                href={gift.productUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-3 rounded-md bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700"
              >
                View product
              </a>
            ) : null}

            <div className="mt-2 text-xs text-gray-500">Last edited: {lastEdited || "—"}</div>

            <div className="mt-3">
              <button
                onClick={() => setEditing(true)}
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
              >
                Edit
              </button>
            </div>
          </div>

          {gift.imageUrl ? (
            <img
              src={gift.imageUrl}
              alt=""
              className="w-24 h-24 object-cover rounded-md ml-4"
            />
          ) : null}
        </div>
      </div>
    );
  }

  // ---- EDIT MODE ----
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <form onSubmit={save} className="space-y-2">
        {error ? (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <input
            className="rounded-md border px-2 py-1"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title"
            required
          />
          <input
            className="rounded-md border px-2 py-1"
            value={form.productUrl}
            onChange={(e) => setForm({ ...form, productUrl: e.target.value })}
            placeholder="Product URL"
            type="url"
          />
        </div>

        <textarea
          className="w-full rounded-md border px-2 py-1"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description"
        />

        <div className="grid grid-cols-3 gap-2">
          <input
            className="rounded-md border px-2 py-1"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="Image URL"
            type="url"
          />
          <input
            className="rounded-md border px-2 py-1"
            value={String(form.price ?? "")}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="Price"
            type="number"
            step="0.01"
          />
          <input
            className="rounded-md border px-2 py-1"
            value={String(form.deliveryCost ?? "")}
            onChange={(e) => setForm({ ...form, deliveryCost: e.target.value })}
            placeholder="Delivery Cost"
            type="number"
            step="0.01"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 items-center">
          <input
            className="rounded-md border px-2 py-1"
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            placeholder="Size"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm">Rating</label>
            <input
              type="range"
              min={1}
              max={10}
              value={Number(form.priority)}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
            />
            <span className="text-sm">{form.priority}/10</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border px-3 py-1.5 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}