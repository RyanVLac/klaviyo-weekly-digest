export class HttpError extends Error {
  status: number;
  bodyText: string;

  constructor(message: string, status: number, bodyText: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.bodyText = bodyText;
  }
}

type FetchJsonInit = Omit<RequestInit, "body"> & { body?: any };

export async function fetchJson<T>(url: string, init: FetchJsonInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  // If caller passed a body object, encode JSON.
  let body: BodyInit | undefined = undefined;
  if (init.body !== undefined) {
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    body = typeof init.body === "string" ? init.body : JSON.stringify(init.body);
  }

  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const res = await fetch(url, { ...init, headers, body });
  const text = await res.text();

  if (!res.ok) {
    throw new HttpError(`Request failed: ${res.status} ${res.statusText}`, res.status, text);
  }

  // Some APIs may return empty bodies
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    // Return raw text if it isn't JSON
    return text as unknown as T;
  }
}
