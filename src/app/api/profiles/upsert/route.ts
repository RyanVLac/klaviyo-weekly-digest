import { NextResponse } from "next/server";
import { getOrCreateProfileId } from "@/lib/klaviyo/profiles";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const email = body?.email?.trim();
  const preferences = body?.preferences ?? {};

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const profileId = await getOrCreateProfileId(email, preferences);
  return NextResponse.json({ ok: true, profileId });
}
