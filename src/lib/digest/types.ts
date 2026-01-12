// src/lib/digest/types.ts
export type EventLike =
  | {
      type: "page_view";
      ts: string;
      urlPath?: string | null;
      title?: string | null;
      topic?: string | null;
      dwellSeconds?: number | null;
    }
  | {
      type: "product_view";
      ts: string;
      urlPath?: string | null;
      title?: string | null;
      topic?: string | null;
      productId?: string | null;
      productName?: string | null;
      price?: number | null;
    };

export type DigestStats = {
  pageViews: number;
  productViews: number;
  totalDwellSeconds: number;
};

export type DigestTopic = {
  topic: string;
  score: number;
  pageViews: number;
  productViews: number;
  dwellSeconds: number;
};

export type DigestProduct = {
  productId: string;
  productName: string;
  views: number;
  lastSeenISO: string;
  avgPrice: number | null;
};

export type WeeklyDigest = {
  period: { sinceISO: string; untilISO: string };
  stats: DigestStats;
  topTopics: DigestTopic[];
  topProducts: DigestProduct[];
  narrative: string;
};

export type DigestAiResult = {
  headline: string;
  summary: string;
  inferredTopics: Array<{ topic: string; confidence: number; evidence: string }>;
  recommendedProducts: Array<{ productId: string | null; productName: string; reason: string }>;
};
