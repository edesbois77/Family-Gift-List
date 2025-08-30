// lib/summarize.ts
import OpenAI from "openai";

const MAX_DEFAULT = 400;

// Trim to a character cap without slicing mid-word
function safeTruncate(input: string, maxChars = MAX_DEFAULT): string {
  const text = input.replace(/\s+/g, " ").trim();
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars - 1);
  const i = slice.lastIndexOf(" ");
  return (i > 120 ? slice.slice(0, i) : slice).trim() + "…";
}

// Simple no-API fallback: take first 2–3 sentences and cap
function fallbackSummary(text: string, maxChars = MAX_DEFAULT): string {
  const first = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.?!])\s+/)
    .slice(0, 3)
    .join(" ");
  return safeTruncate(first, maxChars);
}

/**
 * Summarise article text to a single paragraph, default 400 chars.
 * Auto uses OpenAI if OPENAI_API_KEY is set, otherwise falls back locally.
 */
export async function summarize(
  text: string,
  opts: { maxChars?: number; title?: string; source?: string } = {}
): Promise<string> {
  const maxChars = opts.maxChars ?? MAX_DEFAULT;

  // No key, use local fallback
  if (!process.env.OPENAI_API_KEY) {
    console.log("[SUMMARIZER] No API key, using local fallback");
    return fallbackSummary(text, maxChars);
  }

  // Try OpenAI, fall back on any error
  try {
    console.log("[SUMMARIZER] API key found, using OpenAI");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = [
      "You are a sports news summarizer.",
      `Write a single concise summary, at most ${maxChars} characters.`,
      "UK English, one paragraph, no bullet points.",
      "State who, what, where, and why it matters.",
      "Do not include image captions, credits, hashtags, links, or bylines.",
      opts.title ? `Title: ${opts.title}` : "",
      opts.source ? `Source: ${opts.source}` : "",
      "Article body:",
      text.slice(0, 8000) // keep token usage sensible
    ]
      .filter(Boolean)
      .join("\n\n");

    const res = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    // @ts-ignore output_text is provided by the SDK helper
    const raw = (res.output_text ?? "").toString().trim();
    if (!raw) throw new Error("Empty summary from model");
    return safeTruncate(raw, maxChars);
  } catch (err: any) {
    console.error("[SUMMARIZER] OpenAI failed, falling back:", err?.message || err);
    return fallbackSummary(text, maxChars);
  }
}

/**
 * Optional helper if you want to know which path was used.
 * Not required by your current code, safe to ignore.
 */
export async function summarizeWithMeta(
  text: string,
  opts: { maxChars?: number; title?: string; source?: string } = {}
): Promise<{ summary: string; origin: "openai" | "fallback" }> {
  const maxChars = opts.maxChars ?? MAX_DEFAULT;

  if (!process.env.OPENAI_API_KEY) {
    return { summary: fallbackSummary(text, maxChars), origin: "fallback" };
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = [
      "You are a sports news summarizer.",
      `Write a single concise summary, at most ${maxChars} characters.`,
      "UK English, one paragraph, no bullet points.",
      "Avoid captions, credits, hashtags, links, and bylines.",
      opts.title ? `Title: ${opts.title}` : "",
      opts.source ? `Source: ${opts.source}` : "",
      "Article body:",
      text.slice(0, 8000)
    ]
      .filter(Boolean)
      .join("\n\n");

    const res = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });
    // @ts-ignore
    const raw = (res.output_text ?? "").toString().trim();
    if (!raw) throw new Error("Empty summary from model");
    return { summary: safeTruncate(raw, maxChars), origin: "openai" };
  } catch {
    return { summary: fallbackSummary(text, maxChars), origin: "fallback" };
  }
}