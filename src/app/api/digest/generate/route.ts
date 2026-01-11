import { NextResponse } from "next/server";
import { getOrCreateProfileId } from "@/lib/klaviyo/profiles";
import { KlaviyoApiError } from "@/lib/klaviyo/client";
import { listRecentEventsForProfile } from "@/lib/klaviyo/events-read";
import { buildWeeklyDigest } from "@/lib/digest/buildDigest";
import { generateDigestAi } from "@/lib/ai/generateDigestAi";

function toISO(d: Date) {
  return d.toISOString();
}

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

function getMetricName(e: any): string | null {
  return (
    e?.attributes?.metric?.name ??
    e?.attributes?.metric_name ??
    e?.metric_name ??
    e?.metricName ??
    null
  );
}

function getProps(e: any): Record<string, any> {
  return (
    e?.attributes?.properties ??
    e?.attributes?.event_properties ??
    e?.properties ??
    {}
  );
}

function getTimestamp(e: any): string {
  return (
    e?.attributes?.timestamp ??
    e?.attributes?.time ??
    e?.attributes?.datetime ??
    e?.attributes?.created ??
    new Date().toISOString()
  );
}

function toEventLike(e: any): EventLike | null {
  const metricName = (getMetricName(e) ?? "").toLowerCase();
  const props = getProps(e);

  const urlPath = props.url_path ?? props.urlPath ?? null;
  const title = props.title ?? null;
  const topic = props.topic ?? null;

  const dwellSeconds =
    typeof props.dwell_seconds === "number"
      ? props.dwell_seconds
      : typeof props.dwellSeconds === "number"
      ? props.dwellSeconds
      : null;

  const productId = props.product_id ?? props.productId ?? null;
  const productName = props.product_name ?? props.productName ?? null;

  const price =
    typeof props.price === "number"
      ? props.price
      : typeof props.price === "string"
      ? Number(props.price)
      : null;

  const ts = getTimestamp(e);

  if (metricName.includes("page viewed")) {
    return { type: "page_view", ts, urlPath, title, topic, dwellSeconds };
  }

  if (metricName.includes("product viewed")) {
    return {
      type: "product_view",
      ts,
      urlPath,
      title,
      topic,
      productId,
      productName,
      price: Number.isFinite(price as number) ? (price as number) : null,
    };
  }

  return null;
}

function computeStatsFromNormalized(events: EventLike[]) {
  let pageViews = 0;
  let productViews = 0;
  let totalDwellSeconds = 0;

  for (const e of events) {
    if (e.type === "page_view") pageViews++;
    if (e.type === "product_view") productViews++;
    if (typeof e.dwellSeconds === "number" && Number.isFinite(e.dwellSeconds)) {
      totalDwellSeconds += e.dwellSeconds;
    }
  }

  return { pageViews, productViews, totalDwellSeconds };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const email = body?.email?.trim();
    const days = Number.isFinite(Number(body?.days)) ? Number(body.days) : 7;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
    }

    const until = new Date();
    const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);

    const sinceISO = toISO(since);
    const untilISO = toISO(until);

    const profileId = await getOrCreateProfileId(email);

    const rawEvents = await listRecentEventsForProfile({
      profileId,
      sinceISO,
      maxPages: 5,
    });

    const digest = buildWeeklyDigest({
      sinceISO,
      untilISO,
      events: rawEvents,
    });

    const normalizedEvents = rawEvents.map(toEventLike).filter(Boolean) as EventLike[];

    // Prefer digest.stats if present, otherwise compute from normalized events
    const stats =
      (digest as any)?.stats ??
      (digest as any)?.data?.stats ??
      computeStatsFromNormalized(normalizedEvents);

    const topTopics = (digest as any)?.topTopics ?? (digest as any)?.data?.topTopics ?? [];
    const topProducts = (digest as any)?.topProducts ?? (digest as any)?.data?.topProducts ?? [];

    const candidateTopics =
      Array.isArray(topTopics) ? topTopics.map((t: any) => t?.topic).filter(Boolean) : [];

    const candidateProducts = Array.isArray(topProducts) ? topProducts : [];

    let aiDigest = null;
    try {
      aiDigest = await generateDigestAi({
        email,
        events: normalizedEvents,
        stats,
        candidateTopics,
        candidateProducts,
      });
    } catch {
      aiDigest = null;
    }

    return NextResponse.json({
      ok: true,
      email,
      profileId,

      digest,
      meta: { fetchedEvents: rawEvents.length },

      fetchedEvents: normalizedEvents.length,
      normalizedEvents: normalizedEvents.slice(-25),
      stats,

      aiUsed: Boolean(aiDigest),
      aiDigest,
    });
  } catch (err) {
    if (err instanceof KlaviyoApiError) {
      return NextResponse.json(
        { ok: false, klaviyoStatus: err.status, klaviyoBody: err.bodyText },
        { status: err.status }
      );
    }

    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}


