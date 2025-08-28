export async function summarize(text: string): Promise<string> {
  const trimmed = (text || "").trim();
  if (!trimmed) return "No content detected.";

  const approx = simpleExtractive(trimmed, 480);
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    return approx;
  }

  try {
    // Minimal fetch call, avoids SDK churn
    const body = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a sports editor. Summarize football news into a single 400-500 character TLDR, neutral tone, no fluff. Include team and player names if relevant.",
        },
        { role: "user", content: trimmed.slice(0, 8000) },
      ],
      temperature: 0.2,
      max_tokens: 180,
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("OpenAI error");
    const data = await res.json();

    const out =
      data?.choices?.[0]?.message?.content?.trim() ||
      approx;

    return cleanOneLine(out).slice(0, 520);
  } catch {
    return approx;
  }
}

function simpleExtractive(text: string, limit: number): string {
  // Grab first 2 sentences then trim to limit
  const first = text.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  const base = first.length > 60 ? first : text.slice(0, limit);
  return cleanOneLine(base).slice(0, limit);
}

function cleanOneLine(s: string): string {
  return s.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}
