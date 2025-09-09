"use client";

import * as React from "react";

type Props = { text: string; className?: string };

export default function CopyButton({ text, className }: Props) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // basic fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }

  return (
    <button onClick={handleCopy} className={className ?? "text-blue-600 hover:text-blue-800 text-sm"}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}