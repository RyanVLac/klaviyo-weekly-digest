import { NextResponse } from "next/server";
import { getOrCreateProfileId } from "@/lib/klaviyo/profiles";
import { KlaviyoApiError } from "@/lib/klaviyo/client";
import { listRecentEventsForProfile } from "@/lib/klaviyo/events-read";
import { buildWeeklyDigest } from "@/lib/digest/buildDigest";

function toISO(d: Date) {
  // RFC3339
  return d.toISOString();
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

    const events = await listRecentEventsForProfile({
      profileId,
      sinceISO,
      maxPages: 5,
    });

    const digest = buildWeeklyDigest({
      sinceISO,
      untilISO,
      events,
    });

    return NextResponse.json({
      ok: true,
      email,
      profileId,
      digest,
      meta: { fetchedEvents: events.length },
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
