// src/utils/topics.ts
export function normalizeTopic(t: unknown): string | null {
  if (typeof t !== "string") return null;
  const v = t.trim().toLowerCase();
  if (!v) return null;
  if (v === "unknown" || v === "null" || v === "undefined") return null;
  return v;
}

const TOPIC_KEYWORDS: Record<string, string[]> = {
  boots: ["boot", "boots", "hiking boot", "leather boot"],
  jackets: ["jacket", "jackets", "parka", "puffer", "rain jacket", "coat"],
  snow: ["snow", "ski", "snowboard", "thermal", "base layer", "gloves"],
  running: ["run", "running", "runner", "trail", "sneaker", "shoe"],
};

function scoreTopic(text: string, topic: string): number {
  const keys = TOPIC_KEYWORDS[topic] ?? [];
  let score = 0;
  for (const k of keys) {
    if (text.includes(k)) score += 1;
  }
  return score;
}

export function inferTopicFromContext(args: {
  topic?: unknown;
  urlPath?: unknown;
  title?: unknown;
  productName?: unknown;
}): string | null {
  // If topic is already valid, keep it.
  const direct = normalizeTopic(args.topic);
  if (direct) return direct;

  const text = [
    typeof args.urlPath === "string" ? args.urlPath : "",
    typeof args.title === "string" ? args.title : "",
    typeof args.productName === "string" ? args.productName : "",
  ]
    .join(" ")
    .toLowerCase();

  if (!text.trim()) return null;

  let bestTopic: string | null = null;
  let bestScore = 0;

  for (const topic of Object.keys(TOPIC_KEYWORDS)) {
    const s = scoreTopic(text, topic);
    if (s > bestScore) {
      bestScore = s;
      bestTopic = topic;
    }
  }

  // Require at least 1 keyword match
  return bestScore >= 1 ? bestTopic : null;
}
