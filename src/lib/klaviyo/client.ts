import { config } from "@/lib/config";

export class KlaviyoApiError extends Error {
  status: number;
  bodyText: string;

  constructor(message: string, status: number, bodyText: string) {
    super(message);
    this.name = "KlaviyoApiError";
    this.status = status;
    this.bodyText = bodyText;
  }
}

function joinUrl(base: string, path: string): string {
  if (!path) return base;
  if (path.startsWith("/")) return `${base}${path}`;
  return `${base}/${path}`;
}

export async function klaviyoFetchJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = joinUrl(config.klaviyoApiBase, path);

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Klaviyo-API-Key ${config.klaviyoPrivateKey}`);
  headers.set("revision", config.klaviyoRevision);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...init, headers });

  const text = await res.text();
  if (!res.ok) {
    throw new KlaviyoApiError(
      `Klaviyo request failed: ${res.status} ${res.statusText}`,
      res.status,
      text
    );
  }

  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new KlaviyoApiError(
      "Klaviyo returned non-JSON response",
      res.status,
      text
    );
  }
}
