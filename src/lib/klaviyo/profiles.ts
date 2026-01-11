import { klaviyoFetchJson } from "@/lib/klaviyo/client";

type ProfilesListResponse = {
  data: Array<{ id: string; type: "profile"; attributes?: { email?: string } }>;
};

type ProfileCreateResponse = {
  data: { id: string; type: "profile" };
};

export async function findProfileIdByEmail(email: string): Promise<string | null> {
  const encoded = encodeURIComponent(`equals(email,"${email}")`);
  const res = await klaviyoFetchJson<ProfilesListResponse>(`/profiles?filter=${encoded}&page[size]=1`);
  return res.data?.[0]?.id ?? null;
}

export async function createProfile(email: string, properties: Record<string, unknown> = {}): Promise<string> {
  const body = {
    data: {
      type: "profile",
      attributes: {
        email,
        properties
      }
    }
  };

  const res = await klaviyoFetchJson<ProfileCreateResponse>("/profiles", {
    method: "POST",
    body: JSON.stringify(body)
  });

  return res.data.id;
}

export async function getOrCreateProfileId(
  email: string,
  properties: Record<string, unknown> = {}
): Promise<string> {
  const existing = await findProfileIdByEmail(email);
  if (existing) return existing;
  return await createProfile(email, properties);
}
