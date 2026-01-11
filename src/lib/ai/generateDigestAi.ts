import { openai } from "@/lib/ai/openai";
import { config } from "@/lib/config";

export type DigestAiResult = {
  headline: string;
  summary: string;
  inferredTopics: Array<{ topic: string; confidence: number; evidence: string }>;
  recommendedProducts: Array<{
    productId: string | null;
    productName: string;
    reason: string;
  }>;
};

type EventLike = {
  type: "page_view" | "product_view";
  ts: string;
  urlPath?: string | null;
  title?: string | null;
  topic?: string | null;
  dwellSeconds?: number | null;
  productId?: string | null;
  productName?: string | null;
  price?: number | null;
};

type CandidateProduct = {
  productId: string;
  productName: string;
  avgPrice?: number | null;
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.65;
  return Math.max(0, Math.min(1, n));
}

function safeStr(x: any, fallback = ""): string {
  if (typeof x === "string") return x;
  if (x == null) return fallback;
  return String(x);
}

function uniqLower(list: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of list) {
    const v = (s ?? "").trim();
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

function normalizeCandidateProducts(input: any[]): CandidateProduct[] {
  if (!Array.isArray(input)) return [];
  const out: CandidateProduct[] = [];
  const seen = new Set<string>();

  for (const p of input) {
    const productId = safeStr(p?.productId ?? p?.product_id, "").trim();
    const productName = safeStr(p?.productName ?? p?.product_name, "").trim();
    const avgPriceRaw = p?.avgPrice ?? p?.avg_price ?? p?.price ?? null;
    const avgPrice =
      typeof avgPriceRaw === "number"
        ? avgPriceRaw
        : typeof avgPriceRaw === "string"
        ? Number(avgPriceRaw)
        : null;

    if (!productId || !productName) continue;
    if (seen.has(productId)) continue;
    seen.add(productId);

    out.push({
      productId,
      productName,
      avgPrice: Number.isFinite(avgPrice as number) ? (avgPrice as number) : null,
    });
  }

  return out;
}

function ensureMinTopics(ai: DigestAiResult, candidateTopics: string[]): DigestAiResult {
  const candidates = uniqLower(candidateTopics);
  let topics = Array.isArray(ai.inferredTopics) ? ai.inferredTopics : [];

  topics = topics
    .map((t: any) => ({
      topic: safeStr(t?.topic, "").trim(),
      confidence: clamp01(Number(t?.confidence)),
      evidence: safeStr(t?.evidence, "").trim(),
    }))
    .filter((t: any) => t.topic)
    .slice(0, 6);

  const have = new Set(topics.map((t) => t.topic.toLowerCase()));
  const haveCandidateCount = topics.filter((t) =>
    candidates.some((c) => c.toLowerCase() === t.topic.toLowerCase())
  ).length;

  if (candidates.length) {
    let need = Math.max(0, 2 - haveCandidateCount);
    for (const c of candidates) {
      if (need <= 0) break;
      const k = c.toLowerCase();
      if (!have.has(k)) {
        topics.push({
          topic: c,
          confidence: 0.7,
          evidence: "Added from deterministic top topics to ensure coverage.",
        });
        have.add(k);
        need--;
      }
    }
  }

  const fallbackBuckets = ["winter apparel", "outdoor gear", "footwear", "cold weather essentials"];
  for (const fb of fallbackBuckets) {
    if (topics.length >= 3) break;
    const k = fb.toLowerCase();
    if (!have.has(k)) {
      topics.push({
        topic: fb,
        confidence: 0.55,
        evidence: "Fallback topic to ensure digest completeness.",
      });
      have.add(k);
    }
  }

  return { ...ai, inferredTopics: topics.slice(0, 6) };
}

function pickGenericSuggestions(candidateTopics: string[]): string[] {
  const topics = uniqLower(candidateTopics).map((t) => t.toLowerCase());

  const map: Record<string, string[]> = {
    boots: ["All-terrain hiking boots", "Waterproof winter boots"],
    jackets: ["Insulated winter jacket", "Lightweight rain shell"],
    snow: ["Thermal base layer", "Insulated gloves"],
    running: ["Weatherproof running shoes", "Moisture-wicking socks"],
  };

  const out: string[] = [];
  for (const t of topics) {
    if (map[t]) out.push(...map[t]);
  }

  // Always have some safe fallbacks
  out.push("Cold-weather essentials bundle", "Winter accessories kit");

  // de-dupe
  return uniqLower(out);
}

function ensureMinProducts(
  ai: DigestAiResult,
  candidateProducts: CandidateProduct[],
  candidateTopics: string[]
): DigestAiResult {
  const candidates = candidateProducts ?? [];
  let recs = Array.isArray(ai.recommendedProducts) ? ai.recommendedProducts : [];

  recs = recs
    .map((p: any) => ({
      productId: p?.productId ?? null,
      productName: safeStr(p?.productName, "").trim(),
      reason: safeStr(p?.reason, "").trim(),
    }))
    .filter((p: any) => p.productName);

  // If we have 3+ real products, enforce candidate-only (no invented SKUs)
  if (candidates.length >= 3) {
    const byId = new Map(candidates.map((p) => [p.productId, p]));
    recs = recs.filter((r) => r.productId && byId.has(r.productId));

    for (const c of candidates) {
      if (recs.length >= 5) break;
      if (!recs.some((r) => r.productId === c.productId)) {
        recs.push({
          productId: c.productId,
          productName: c.productName,
          reason: "Recommended because you viewed related content this week.",
        });
      }
    }

    // ensure at least 3
    for (const c of candidates) {
      if (recs.length >= 3) break;
      if (!recs.some((r) => r.productId === c.productId)) {
        recs.push({
          productId: c.productId,
          productName: c.productName,
          reason: "Added from known viewed products to ensure recommendations.",
        });
      }
    }

    return { ...ai, recommendedProducts: recs.slice(0, 5) };
  }

  // If we have 1–2 real products, include them + allow generic product-type suggestions (productId=null)
  if (candidates.length > 0) {
    const byId = new Map(candidates.map((p) => [p.productId, p]));

    // Keep any valid candidate recs
    recs = recs.filter((r) => r.productId && byId.has(r.productId));

    // Ensure we include all candidate products at least once
    for (const c of candidates) {
      if (!recs.some((r) => r.productId === c.productId)) {
        recs.push({
          productId: c.productId,
          productName: c.productName,
          reason: "You viewed this product (or closely related content) this week.",
        });
      }
    }

    // Pad with generic suggestions until we have 3–5 total
    const generic = pickGenericSuggestions(candidateTopics);
    for (const name of generic) {
      if (recs.length >= 5) break;
      // avoid duplicating the candidate product name
      if (recs.some((r) => r.productName.toLowerCase() === name.toLowerCase())) continue;

      recs.push({
        productId: null,
        productName: name,
        reason: "Suggested based on your top topics and browsing patterns this week.",
      });
    }

    // Ensure at least 3
    while (recs.length < 3) {
      recs.push({
        productId: null,
        productName: "Suggested product type",
        reason: "Fallback suggestion to ensure a complete weekly digest.",
      });
    }

    return { ...ai, recommendedProducts: recs.slice(0, 5) };
  }

  // No candidates at all: all generic
  while (recs.length < 3) {
    recs.push({
      productId: null,
      productName: "Suggested product type",
      reason: "Fallback suggestion (no viewed products available).",
    });
  }

  return { ...ai, recommendedProducts: recs.slice(0, 5) };
}

export async function generateDigestAi(args: {
  email: string;
  events: EventLike[];
  stats: { pageViews: number; productViews: number; totalDwellSeconds: number };
  candidateTopics?: string[];
  candidateProducts?: any[];
}): Promise<DigestAiResult | null> {
  if (!openai) return null;

  const candidateTopics = uniqLower(args.candidateTopics ?? []);
  const candidateProducts = normalizeCandidateProducts(args.candidateProducts ?? []);
  const trimmedEvents = (args.events ?? []).slice(-50);

  const system =
    "You generate a weekly interest digest from browsing events. " +
    "Return ONLY valid JSON (no markdown, no extra text).";

  const rules = `
Return ONLY JSON matching EXACTLY:
{
  "headline": string,
  "summary": string,
  "inferredTopics": [
    { "topic": string, "confidence": number, "evidence": string }
  ],
  "recommendedProducts": [
    { "productId": string | null, "productName": string, "reason": string }
  ]
}

Rules:
- Write the digest as a summary of the USER'S activity (avoid marketing copy like "our latest offerings").
- inferredTopics MUST contain 3 to 6 items.
- If Candidate Topics are provided, inferredTopics MUST include at least 2 topics from Candidate Topics.
- confidence MUST be between 0 and 1.
- recommendedProducts MUST contain 3 to 5 items.
- If Candidate Products count is 3 or more:
  - recommendedProducts MUST ONLY use those products (productId cannot be null).
  - Do NOT invent product IDs or product names.
- If Candidate Products count is 1 or 2:
  - include those candidate products (with their productId)
  - you MAY add generic product-type suggestions with productId = null (do NOT invent SKUs)
- If Candidate Products are empty:
  - productId MUST be null for all recommendedProducts.
- Reasons should reference browsing evidence (topics/pages viewed), not "reviews" or popularity claims unless supported.
`;

  const userPayload = {
    email: args.email,
    stats: args.stats,
    candidateTopics,
    candidateProducts,
    events: trimmedEvents,
  };

  const response = await openai.responses.create({
    model: config.openaiModel,
    input: [
      { role: "system", content: system },
      { role: "user", content: rules },
      { role: "user", content: JSON.stringify(userPayload) },
    ],
    text: { format: { type: "json_object" } },
  });

  const raw = response.output_text;

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  let result: DigestAiResult = {
    headline: safeStr(parsed?.headline, "").trim() || "Weekly Digest Overview",
    summary:
      safeStr(parsed?.summary, "").trim() ||
      "Here’s what stood out this week based on your browsing.",
    inferredTopics: Array.isArray(parsed?.inferredTopics) ? parsed.inferredTopics : [],
    recommendedProducts: Array.isArray(parsed?.recommendedProducts) ? parsed.recommendedProducts : [],
  };

  result = ensureMinTopics(result, candidateTopics);
  result = ensureMinProducts(result, candidateProducts, candidateTopics);

  return result;
}
