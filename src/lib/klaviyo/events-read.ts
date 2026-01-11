import { config } from "@/lib/config";
import { KlaviyoApiError } from "@/lib/klaviyo/client";

/**
 * We only need a small subset of the Events + included Metrics response.
 * This normalizer is defensive because Klaviyo schemas can vary by endpoint/version.
 */

type KlaviyoJsonApi = {
  data: Array<any>;
  included?: Array<any>;
  links?: { next?: string | null };
};

export type NormalizedEvent = {
  datetime: string | null;
  metricName: string;
  properties: Record<string, any>;
};

function klaviyoHeaders() {
  return {
    Authorization: `Klaviyo-API-Key ${config.klaviyoPrivateKey}`,
    revision: config.klaviyoRevision, // must be <= current supported revision 
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function fetchKlaviyoJson(url: string): Promise<KlaviyoJsonApi> {
  const res = await fetch(url, { method: "GET", headers: klaviyoHeaders(), cache: "no-store" });
  const text = await res.text();

  if (!res.ok) {
    throw new KlaviyoApiError(
      `Klaviyo GET failed: ${res.status} ${res.statusText}`,
      res.status,
      text
    );
  }

  try {
    return JSON.parse(text) as KlaviyoJsonApi;
  } catch {
    throw new Error(`Failed to parse Klaviyo JSON. Raw: ${text.slice(0, 300)}...`);
  }
}

export async function listRecentEventsForProfile(opts: {
  profileId: string;
  sinceISO: string; // RFC3339, e.g. 2026-01-01T00:00:00Z
  maxPages?: number; 
}): Promise<NormalizedEvent[]> {
  const { profileId, sinceISO, maxPages = 5 } = opts;

  // Filtering syntax reference (comma is implicit AND):
  // equals(profile_id,"..."),greater-or-equal(datetime,2023-02-07),less-than(datetime,2023-02-15)
  // We'll filter by profile_id + since datetime. (We do NOT filter by metric_id because custom metrics may not be supported in that filter.)
  const filterExpr = `equals(profile_id,"${profileId}"),greater-or-equal(datetime,${sinceISO})`;

  const base = new URL(`${config.klaviyoApiBase}/events`);
  base.searchParams.set("filter", filterExpr);
  base.searchParams.set("include", "metric");
  base.searchParams.set("sort", "-datetime");
  base.searchParams.set("page[size]", "200");

  const out: NormalizedEvent[] = [];

  let nextUrl: string | null = base.toString();
  let pageCount = 0;

  while (nextUrl && pageCount < maxPages) {
    pageCount += 1;

    const json = await fetchKlaviyoJson(nextUrl);

    // Build metricId -> metricName map from included
    const metricNameById = new Map<string, string>();
    for (const inc of json.included ?? []) {
      if (inc?.type === "metric" && inc?.id) {
        const name = inc?.attributes?.name;
        if (typeof name === "string" && name.trim()) metricNameById.set(inc.id, name.trim());
      }
    }

    for (const ev of json.data ?? []) {
      const metricId = ev?.relationships?.metric?.data?.id ?? null;
      const metricName =
        (metricId && metricNameById.get(metricId)) ||
        ev?.relationships?.metric?.data?.id ||
        "Unknown Metric";

      const datetime: string | null =
        typeof ev?.attributes?.datetime === "string"
          ? ev.attributes.datetime
          : typeof ev?.attributes?.timestamp === "string"
            ? ev.attributes.timestamp
            : null;

      const props =
        (ev?.attributes?.properties && typeof ev.attributes.properties === "object"
          ? ev.attributes.properties
          : null) ??
        (ev?.attributes?.event_properties && typeof ev.attributes.event_properties === "object"
          ? ev.attributes.event_properties
          : null) ??
        {};

      out.push({
        datetime,
        metricName: String(metricName),
        properties: props as Record<string, any>,
      });
    }

    nextUrl = json.links?.next ?? null;
  }

  return out;
}
