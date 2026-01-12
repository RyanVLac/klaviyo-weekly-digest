"use client";

import { useEffect, useState } from "react";
import { getActiveEmail } from "@/lib/client/user";

async function postJson(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.error ?? json?.message ?? text ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json;
}

export function ActiveEmailBanner() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(getActiveEmail());
  }, []);

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="muted">
        <b>Active email:</b> {email || "(none)"}{" "}
        {!email ? <span>— go to /signup first.</span> : null}
      </div>
    </div>
  );
}

export function TrackPageViewButton(props: {
  title?: string | null;
  topic?: string | null;
  urlPath?: string;
  dwellSeconds?: number | null;
}) {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  async function run() {
    const email = getActiveEmail();
    if (!email) {
      setStatus("err");
      return;
    }
    setStatus("idle");
    try {
      await postJson("/api/track/page-view", {
        email,
        urlPath: props.urlPath ?? window.location.pathname,
        title: props.title ?? null,
        topic: props.topic ?? null,
        dwellSeconds: typeof props.dwellSeconds === "number" ? props.dwellSeconds : null,
      });
      setStatus("ok");
      setTimeout(() => setStatus("idle"), 900);
    } catch {
      setStatus("err");
      setTimeout(() => setStatus("idle"), 1200);
    }
  }

  return (
    <button className="btn" onClick={run} type="button">
      Track Page View {status === "ok" ? "✓" : status === "err" ? "✗" : ""}
    </button>
  );
}

export function TrackProductViewButton(props: {
  productId: string;
  productName: string;
  price?: number | null;
  topic?: string | null;
  urlPath?: string;
}) {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  async function run() {
    const email = getActiveEmail();
    if (!email) {
      setStatus("err");
      return;
    }

    setStatus("idle");
    try {
      await postJson("/api/track/product-view", {
        email,
        productId: props.productId,
        productName: props.productName,
        price: typeof props.price === "number" ? props.price : null,
        topic: props.topic ?? null,
        urlPath: props.urlPath ?? window.location.pathname,
      });
      setStatus("ok");
      setTimeout(() => setStatus("idle"), 900);
    } catch {
      setStatus("err");
      setTimeout(() => setStatus("idle"), 1200);
    }
  }

  return (
    <button className="btn" onClick={run} type="button">
      Track Product View {status === "ok" ? "✓" : status === "err" ? "✗" : ""}
    </button>
  );
}

export function AutoTrackPageView(props: {
  title?: string | null;
  topic?: string | null;
  dwellSeconds?: number | null;
}) {
  useEffect(() => {
    const email = getActiveEmail();
    if (!email) return;

    postJson("/api/track/page-view", {
      email,
      urlPath: window.location.pathname,
      title: props.title ?? null,
      topic: props.topic ?? null,
      dwellSeconds: typeof props.dwellSeconds === "number" ? props.dwellSeconds : null,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function AutoTrackProductView(props: {
  productId: string;
  productName: string;
  price?: number | null;
  topic?: string | null;
}) {
  useEffect(() => {
    const email = getActiveEmail();
    if (!email) return;

    postJson("/api/track/product-view", {
      email,
      urlPath: window.location.pathname,
      productId: props.productId,
      productName: props.productName,
      price: typeof props.price === "number" ? props.price : null,
      topic: props.topic ?? null,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
