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

type ValidationIssue = {
  code:
    | "bad_json"
    | "missing_fields"
    | "topics_count"
    | "products_count"
    | "candidate_topics_coverage"
    | "candidate_products_policy";
  message: string;
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

/**
 * Generic topic inference.
 * Pulls from explicit topic OR urlPath segments like /demo/boots -> "boots".
 */
function inferGenericTopicFromEvent(e: EventLike): { topic: string; evidence: string } | null {
  const direct = (e.topic ?? "").trim();
  if (direct && direct.toLowerCase() !== "unknown") {
    return { topic: direct, evidence: `Event included topic="${direct}".` };
  }

  const url = (e.urlPath ?? "").trim();
  if (url) {
    const parts = url
      .split(/[\/\?\#]/g)
      .map((p) => p.trim())
      .filter(Boolean);

    const stop = new Set([
      "demo",
      "products",
      "product",
      "content",
      "page",
      "api",
      "track",
      "dashboard",
      "signup",
    ]);

    // pick the last "meaningful" segment
    for (let i = parts.length - 1; i >= 0; i--) {
      const seg = parts[i].toLowerCase();
      if (!seg || stop.has(seg)) continue;

      // avoid likely ids (contain lots of digits)
      const digitCount = (seg.match(/\d/g) ?? []).length;
      if (digitCount >= 3) continue;

      const topic = seg.replace(/[-_]+/g, " ").trim();
      if (!topic) continue;

      return { topic, evidence: `Inferred from urlPath "${url}".` };
    }
  }

  const title = (e.title ?? "").trim();
  if (title) {
    // last-resort: use a compact title hint (still generic)
    const cleaned = title.replace(/\s+/g, " ").trim();
    if (cleaned.length <= 40) {
      return { topic: cleaned.toLowerCase(), evidence: `Inferred from title "${cleaned}".` };
    }
  }

  return null;
}

function sanitizeResult(parsed: any): DigestAiResult {
  const inferredTopicsRaw = Array.isArray(parsed?.inferredTopics) ? parsed.inferredTopics : [];
  const productsRaw = Array.isArray(parsed?.recommendedProducts) ? parsed.recommendedProducts : [];

  const inferredTopics = inferredTopicsRaw
    .map((t: any) => ({
      topic: safeStr(t?.topic, "").trim(),
      confidence: clamp01(Number(t?.confidence)),
      evidence: safeStr(t?.evidence, "").trim(),
    }))
    .filter((t: any) => t.topic)
    .slice(0, 12); // we will trim later

  const recommendedProducts = productsRaw
    .map((p: any) => ({
      productId: p?.productId ?? null,
      productName: safeStr(p?.productName, "").trim(),
      reason: safeStr(p?.reason, "").trim(),
    }))
    .filter((p: any) => p.productName)
    .slice(0, 12); // we will trim later

  return {
    headline: safeStr(parsed?.headline, "").trim() || "Your Weekly Digest",
    summary:
      safeStr(parsed?.summary, "").trim() ||
      "Here’s what stood out this week based on your browsing activity.",
    inferredTopics,
    recommendedProducts,
  };
}

function enforceConstraints(args: {
  result: DigestAiResult;
  candidateTopics: string[];
  candidateProducts: CandidateProduct[];
  events: EventLike[];
}): { result: DigestAiResult; issues: ValidationIssue[] } {
  const { candidateTopics, candidateProducts, events } = args;
  let result = args.result;

  const issues: ValidationIssue[] = [];

  const topicSeen = new Set<string>();
  let topics = (result.inferredTopics ?? [])
    .map((t) => ({
      topic: safeStr(t.topic, "").trim(),
      confidence: clamp01(Number(t.confidence)),
      evidence: safeStr(t.evidence, "").trim(),
    }))
    .filter((t) => t.topic)
    .filter((t) => {
      const k = t.topic.toLowerCase();
      if (topicSeen.has(k)) return false;
      topicSeen.add(k);
      return true;
    });

  const candidates = uniqLower(candidateTopics);
  const candidatesLower = new Set(candidates.map((c) => c.toLowerCase()));

  if (candidates.length) {
    const haveCandidate = topics.filter((t) => candidatesLower.has(t.topic.toLowerCase())).length;
    if (haveCandidate < 2) {
      issues.push({
        code: "candidate_topics_coverage",
        message: `Need at least 2 topics from candidateTopics; currently have ${haveCandidate}.`,
      });

      for (const c of candidates) {
        if (topics.length >= 6) break;
        const k = c.toLowerCase();
        if (!topicSeen.has(k)) {
          topics.push({
            topic: c,
            confidence: 0.72,
            evidence: "Added because it appeared in deterministic top topics this week.",
          });
          topicSeen.add(k);
          if (topics.filter((t) => candidatesLower.has(t.topic.toLowerCase())).length >= 2) break;
        }
      }
    }
  }

  if (topics.length < 3) {
    issues.push({
      code: "topics_count",
      message: `Need 3..6 inferredTopics; currently have ${topics.length}.`,
    });

    for (const e of events) {
      if (topics.length >= 3) break;
      const inferred = inferGenericTopicFromEvent(e);
      if (!inferred) continue;

      const k = inferred.topic.toLowerCase();
      if (topicSeen.has(k)) continue;

      topics.push({
        topic: inferred.topic,
        confidence: 0.65,
        evidence: inferred.evidence,
      });
      topicSeen.add(k);
    }
  }

  while (topics.length < 3) {
    topics.push({
      topic: "general interest",
      confidence: 0.55,
      evidence: "Fallback topic because event signals were limited.",
    });
  }

  topics = topics.slice(0, 6);

  const byId = new Map(candidateProducts.map((p) => [p.productId, p]));
  const candidateCount = candidateProducts.length;

  let recs = (result.recommendedProducts ?? []).map((p) => ({
    productId: p.productId ?? null,
    productName: safeStr(p.productName, "").trim(),
    reason: safeStr(p.reason, "").trim(),
  }));

  recs = recs.filter((r) => r.productName);

  if (candidateCount >= 3) {
    const before = recs.length;
    recs = recs.filter((r) => r.productId && byId.has(String(r.productId)));
    if (recs.length !== before) {
      issues.push({
        code: "candidate_products_policy",
        message: "Removed non-candidate recommendations because candidateProducts>=3.",
      });
    }

    for (const c of candidateProducts) {
      if (recs.length >= 5) break;
      if (!recs.some((r) => r.productId === c.productId)) {
        recs.push({
          productId: c.productId,
          productName: c.productName,
          reason: "Recommended because it aligns with what you browsed most this week.",
        });
      }
    }

    while (recs.length < 3) {
      const next = candidateProducts.find((c) => !recs.some((r) => r.productId === c.productId));
      if (!next) break;
      recs.push({
        productId: next.productId,
        productName: next.productName,
        reason: "Added from known products to complete the digest recommendations.",
      });
    }

    recs = recs.slice(0, 5);
  } else if (candidateCount > 0) {
    for (const c of candidateProducts) {
      if (!recs.some((r) => r.productId === c.productId)) {
        recs.unshift({
          productId: c.productId,
          productName: c.productName,
          reason: "You viewed this product (or very similar content) this week.",
        });
      }
    }

    // If model invented a productId not in candidates, null it out
    recs = recs.map((r) => {
      if (r.productId && !byId.has(String(r.productId))) {
        return {
          ...r,
          productId: null,
          reason: r.reason || "Suggested based on your browsing this week.",
        };
      }
      return r;
    });

    const topTopicNames = topics.map((t) => t.topic).filter(Boolean).slice(0, 3);
    while (recs.length < 3) {
      const t = topTopicNames[recs.length - 1] ?? "your interests";
      recs.push({
        productId: null,
        productName: `Suggested item for ${t}`,
        reason: "Suggestion based on your strongest browsing signals this week.",
      });
    }

    recs = recs.slice(0, 5);
  } else {
    // No candidates: productId MUST be null
    recs = recs.map((r) => ({ ...r, productId: null }));

    while (recs.length < 3) {
      recs.push({
        productId: null,
        productName: "Suggested item",
        reason: "Suggestion based on your browsing patterns this week.",
      });
    }

    recs = recs.slice(0, 5);
  }

  // Validate counts
  if (topics.length < 3 || topics.length > 6) {
    issues.push({
      code: "topics_count",
      message: `inferredTopics must be 3..6; got ${topics.length}.`,
    });
  }
  if (recs.length < 3 || recs.length > 5) {
    issues.push({
      code: "products_count",
      message: `recommendedProducts must be 3..5; got ${recs.length}.`,
    });
  }

  result = {
    ...result,
    inferredTopics: topics,
    recommendedProducts: recs,
  };

  // Summary/headline sanity
  if (!result.headline.trim() || !result.summary.trim()) {
    issues.push({
      code: "missing_fields",
      message: "headline/summary missing or empty.",
    });
  }

  return { result, issues };
}

async function callOpenAiJson(args: {
  mode: "first" | "repair";
  payload: any;
  issues?: ValidationIssue[];
  previousJson?: any;
}): Promise<any> {
  const system =
    "You generate a weekly digest from browsing events for ONE user. " +
    "Tone: friendly, personal, and descriptive (NOT salesy, NOT marketing). " +
    "Return ONLY valid JSON. No markdown. No extra commentary.";

  const schemaAndRules = `
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

Writing rules:
- Summary must be 3 to 5 sentences, written in second-person ("you").
- Mention at least: (a) top 1–2 topics, (b) 1 concrete product (if available), (c) a stat (pageViews/productViews/totalDwellSeconds).
- Avoid brand voice like "our latest offerings", avoid claims like "excellent reviews" unless supported by data.
- Evidence/reasons should reference the provided events/signals (pages, titles, urlPath, productName).

Content rules:
- inferredTopics MUST contain 3 to 6 items.
- confidence MUST be between 0 and 1.
- recommendedProducts MUST contain 3 to 5 items.
- If candidateProducts count is 3+:
  - recommendedProducts MUST ONLY use those products (productId cannot be null).
  - Do NOT invent product IDs or product names.
- If candidateProducts count is 1–2:
  - include those candidate products (with their productId)
  - you MAY add generic product-type suggestions with productId = null (do NOT invent SKUs)
- If candidateProducts are empty:
  - productId MUST be null for all recommendedProducts.
`;

  const repair = args.mode === "repair";

  const user = repair
    ? {
        task: "Repair your previous JSON to comply with the schema + rules. Keep it accurate to the data.",
        issues: args.issues ?? [],
        previousJson: args.previousJson ?? null,
        payload: args.payload,
      }
    : {
        task: "Generate a weekly digest for the user from the payload.",
        payload: args.payload,
      };

  const response = await openai!.responses.create({
    model: config.openaiModel,
    input: [
      { role: "system", content: system },
      { role: "user", content: schemaAndRules },
      { role: "user", content: JSON.stringify(user) },
    ],
    text: { format: { type: "json_object" } },
  });

  const raw = response.output_text;
  return JSON.parse(raw);
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
  const trimmedEvents = (args.events ?? []).slice(-60);

  const payload = {
    email: args.email,
    stats: args.stats,
    candidateTopics,
    candidateProducts,
    events: trimmedEvents,
  };

  let parsed: any;
  try {
    parsed = await callOpenAiJson({ mode: "first", payload });
  } catch {
    return null;
  }

  let result = sanitizeResult(parsed);
  let check = enforceConstraints({
    result,
    candidateTopics,
    candidateProducts,
    events: trimmedEvents,
  });

  const majorIssues = check.issues.filter((i) =>
    ["topics_count", "products_count", "candidate_products_policy", "candidate_topics_coverage"].includes(i.code)
  );

  if (majorIssues.length) {
    try {
      const repaired = await callOpenAiJson({
        mode: "repair",
        payload,
        issues: check.issues,
        previousJson: parsed,
      });

      result = sanitizeResult(repaired);
      check = enforceConstraints({
        result,
        candidateTopics,
        candidateProducts,
        events: trimmedEvents,
      });
    } catch {
    }
  }

  return check.result;
}
