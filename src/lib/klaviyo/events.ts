import { randomUUID } from "crypto";
import { klaviyoFetchJson } from "@/lib/klaviyo/client";

type EventCreateResponse = {
  data?: { id?: string; type?: string };
};

export async function createEvent(params: {
  metricName: string;
  profileId?: string;
  email?: string;
  properties?: Record<string, unknown>;
  time?: string;
  uniqueId?: string;
}): Promise<string | null> {
  if (!params.profileId && !params.email) {
    throw new Error("createEvent requires either profileId or email");
  }

  const profileData = params.profileId
    ? { type: "profile", id: params.profileId }
    : { type: "profile", attributes: { email: params.email } };

  const body = {
    data: {
      type: "event",
      attributes: {
        metric: {
          data: {
            type: "metric",
            attributes: { name: params.metricName },
          },
        },
        profile: {
          data: profileData,
        },
        properties: params.properties ?? {},
        time: params.time ?? new Date().toISOString(),
        unique_id: params.uniqueId ?? randomUUID(),
      },
    },
  };

  const res = await klaviyoFetchJson<EventCreateResponse>("/events", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return res?.data?.id ?? null;
}
