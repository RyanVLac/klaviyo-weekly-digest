import { NormalizedEvent } from "@/lib/klaviyo/events-read";

export type WeeklyDigest = {
  period: { sinceISO: string; untilISO: string };
  stats: {
    pageViews: number;
    productViews: number;
    totalDwellSeconds: number;
  };
  topTopics: Array<{
    topic: string;
    score: number;
    pageViews: number;
    productViews: number;
    dwellSeconds: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    views: number;
    lastSeenISO: string | null;
    avgPrice: number | null;
  }>;
  narrative: string;
};

function inferTopicFromSignals(props: Record<string, any>): string {
  const direct = typeof props?.topic === "string" ? props.topic.trim() : "";
  if (direct) return direct;

  const url = String(props?.url_path ?? "").toLowerCase();

  // Example: /demo/boots or /category/boots -> boots
  const match = url.match(/\/(demo|category|collections?)\/([^\/\?\#]+)/);
  if (match?.[2]) return match[2].replace(/[-_]/g, " ").trim();

  return "unknown";
}


function safeNum(v: any): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

export function buildWeeklyDigest(opts: {
  sinceISO: string;
  untilISO: string;
  events: NormalizedEvent[];
}): WeeklyDigest {
  const { sinceISO, untilISO } = opts;

  // Only use events we care about for the demo
  const used = opts.events.filter(
    (e) => e.metricName === "Page Viewed" || e.metricName === "Product Viewed"
  );

  let pageViews = 0;
  let productViews = 0;
  let totalDwellSeconds = 0;

  const topicAgg = new Map<
    string,
    { pageViews: number; productViews: number; dwellSeconds: number }
  >();

  const prodAgg = new Map<
    string,
    { productName: string; views: number; lastSeenISO: string | null; priceSum: number; priceCount: number }
  >();

  for (const e of used) {
    const topic = inferTopicFromSignals(e.properties);

    const curTopic = topicAgg.get(topic) ?? { pageViews: 0, productViews: 0, dwellSeconds: 0 };

    if (e.metricName === "Page Viewed") {
      pageViews += 1;
      curTopic.pageViews += 1;

      const dwell = safeNum(e.properties?.dwell_seconds);
      if (dwell != null) {
        totalDwellSeconds += dwell;
        curTopic.dwellSeconds += dwell;
      }
    }

    if (e.metricName === "Product Viewed") {
      productViews += 1;
      curTopic.productViews += 1;

      const productId = typeof e.properties?.product_id === "string" ? e.properties.product_id : null;
      const productName =
        typeof e.properties?.product_name === "string" ? e.properties.product_name : "Unknown Product";

      if (productId) {
        const curProd =
          prodAgg.get(productId) ??
          { productName, views: 0, lastSeenISO: null, priceSum: 0, priceCount: 0 };

        curProd.views += 1;
        curProd.lastSeenISO = e.datetime ?? curProd.lastSeenISO;

        const price = safeNum(e.properties?.price);
        if (price != null) {
          curProd.priceSum += price;
          curProd.priceCount += 1;
        }

        // Keep latest name if it changes
        curProd.productName = productName;
        prodAgg.set(productId, curProd);
      }
    }

    topicAgg.set(topic, curTopic);
  }

  const topTopics = Array.from(topicAgg.entries())
    .filter(([topic]) => topic !== "unknown")
    .map(([topic, v]) => {
      // Simple scoring: product views weighted higher than page views + dwell time
      const score = v.productViews * 3 + v.pageViews * 1 + Math.min(v.dwellSeconds / 10, 20);
      return { topic, score, ...v };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const topProducts = Array.from(prodAgg.entries())
    .map(([productId, v]) => ({
      productId,
      productName: v.productName,
      views: v.views,
      lastSeenISO: v.lastSeenISO,
      avgPrice: v.priceCount ? v.priceSum / v.priceCount : null,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const topicLine =
    topTopics.length > 0
      ? topTopics
          .slice(0, 3)
          .map((t) => t.topic)
          .join(", ")
      : "no clear topics yet";

  const productLine =
    topProducts.length > 0
      ? topProducts
          .slice(0, 3)
          .map((p) => p.productName)
          .join(", ")
      : "no products yet";

  const narrative = `In the last week, you showed interest in ${topicLine}. You viewed ${pageViews} pages and ${productViews} products. Top products: ${productLine}.`;

  return {
    period: { sinceISO, untilISO },
    stats: { pageViews, productViews, totalDwellSeconds },
    topTopics,
    topProducts,
    narrative,
  };
}
