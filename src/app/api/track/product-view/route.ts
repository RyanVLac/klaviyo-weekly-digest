import { NextResponse } from "next/server";
import { getOrCreateProfileId } from "@/lib/klaviyo/profiles";
import { createEvent } from "@/lib/klaviyo/events";
import { KlaviyoApiError } from "@/lib/klaviyo/client";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const email = body?.email?.trim();
    const productId = body?.productId ?? null;
    const productName = body?.productName ?? null;
    const price = body?.price ?? null;
    const urlPath = body?.urlPath ?? null;

    // NEW:
    const topic = typeof body?.topic === "string" && body.topic.trim() ? body.topic.trim() : "uncategorized";

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const profileId = await getOrCreateProfileId(email);

    const eventId = await createEvent({
      profileId,
      metricName: "Product Viewed",
      properties: {
        topic, 
        product_id: productId,
        product_name: productName,
        price,
        url_path: urlPath
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
