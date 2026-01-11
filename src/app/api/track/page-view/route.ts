import { NextResponse } from "next/server";
import { getOrCreateProfileId } from "@/lib/klaviyo/profiles";
import { createEvent } from "@/lib/klaviyo/events";
import { KlaviyoApiError } from "@/lib/klaviyo/client";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const emailRaw = body?.email;
    const email =
      typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";

    const urlPath = typeof body?.urlPath === "string" ? body.urlPath : "/";
    const title = typeof body?.title === "string" ? body.title : null;
    const topic = typeof body?.topic === "string" ? body.topic : null;

    const dwellSeconds =
      typeof body?.dwellSeconds === "number"
        ? body.dwellSeconds
        : body?.dwellSeconds != null
          ? Number(body.dwellSeconds)
          : null;

    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
    }

    const profileId = await getOrCreateProfileId(email);

    const eventId = await createEvent({
      profileId,
      email,
      metricName: "Page Viewed",
      properties: {
        url_path: urlPath,
        title,
        topic,
        dwell_seconds: Number.isFinite(dwellSeconds as number) ? dwellSeconds : null,
      },
    });

    return NextResponse.json({ ok: true, profileId, eventId });
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
