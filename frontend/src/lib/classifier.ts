export type Verdict = { label: "spam" | "ham"; confidence: number; reasons: string[] };

/**
 * Plug your own model in here.
 * Set API_URL to your backend endpoint that accepts { text } and returns
 * { label: "spam" | "ham", confidence: number }. Until then a local heuristic is used.
 */
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const SIGNALS: [RegExp, string][] = [
  [/\b(free|winner|won|prize|lottery|jackpot)\b/i, "Prize / giveaway wording"],
  [/\b(click here|act now|limited time|urgent|immediately)\b/i, "Urgency pressure"],
  [/\b(bitcoin|crypto|investment|guaranteed|risk[- ]free|double your)\b/i, "Financial promise"],
  [/\b(verify your account|password|bank details|ssn|credit card)\b/i, "Requests sensitive info"],
  [/(\$\d{3,}|\d{2,}% off|₹\s?\d{4,})/i, "Large money amounts"],
  [/!{2,}|[A-Z]{6,}/, "Excessive caps / punctuation"],
  [/https?:\/\/\S+/i, "Contains links"],
];

export async function classifyMessage(text: string): Promise<Verdict> {
  if (API_URL) {
    try {
      const r = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type: "email" }),
      });
      if (!r.ok) throw new Error(`API error ${r.status}`);
      const d = await r.json();
      return { label: d.label, confidence: d.confidence, reasons: d.reasons ?? [] };
    } catch (err) {
      console.warn("API unavailable, using local heuristic:", err);
    }
  }
  await new Promise((r) => setTimeout(r, 700));
  const reasons = SIGNALS.filter(([re]) => re.test(text)).map(([, r]) => r);
  const score = Math.min(0.99, 0.08 + reasons.length * 0.22);
  const spam = score >= 0.5;
  return {
    label: spam ? "spam" : "ham",
    confidence: spam ? score : 1 - score,
    reasons: reasons.length ? reasons : ["No suspicious patterns found"],
  };
}
