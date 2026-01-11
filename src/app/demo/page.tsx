"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSavedEmail } from "@/lib/client/user";

type Category = {
  title: string;
  topic: string;
  href: string;
  description: string;
};

const CATEGORIES: Category[] = [
  { title: "Boots", topic: "boots", href: "/demo/boots", description: "Winter boots, leather boots, hiking boots" },
  { title: "Jackets", topic: "jackets", href: "/demo/jackets", description: "Puffer, rain, and work jackets" },
  { title: "Snow Gear", topic: "snow", href: "/demo/snow", description: "Gloves, thermals, base layers" },
  { title: "Running", topic: "running", href: "/demo/running", description: "Shoes + accessories for cold runs" },
];

export default function DemoPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    setEmail(getSavedEmail());
  }, []);

  async function trackPageView(topic: string, urlPath: string, title: string) {
    const e = getSavedEmail();
    if (!e) {
      setStatus("No email saved. Go to /signup first.");
      return;
    }

    setStatus(`Tracking: ${title}...`);
    const res = await fetch("/api/track/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: e,
        urlPath,
        title,
        topic,
        dwellSeconds: 10,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(`Error: ${data?.error || "Failed to track page view"}`);
      return;
    }

    setStatus(`✅ Tracked "${title}" (queued in Klaviyo)`);
  }

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ marginBottom: 6 }}>Demo Browse</h1>
      <p style={{ marginTop: 0 }}>
        Click categories/products — we’ll send <b>Page Viewed</b> and <b>Product Viewed</b> events into Klaviyo.
      </p>

      <div style={{ marginBottom: 16, padding: 12, border: "1px solid #ddd" }}>
        <div><b>Active email:</b> {email ?? "(none)"} </div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>
          If empty, go to <Link href="/signup">/signup</Link> first.
        </div>
      </div>

      {status ? (
        <div style={{ marginBottom: 16, padding: 12, border: "1px solid #ddd" }}>
          {status}
        </div>
      ) : null}

      <h2 style={{ marginTop: 20 }}>Categories</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {CATEGORIES.map((c) => (
          <div key={c.topic} style={{ border: "1px solid #ddd", padding: 14 }}>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>{c.title}</h3>
            <p style={{ marginTop: 0, fontSize: 14, opacity: 0.85 }}>{c.description}</p>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{ padding: "8px 10px" }}
                onClick={() => trackPageView(c.topic, c.href, `${c.title} Category`)}
              >
                Track Page View
              </button>

              <Link href={c.href} style={{ padding: "8px 10px", border: "1px solid #ddd", display: "inline-block" }}>
                Open
              </Link>
            </div>

            <div style={{ marginTop: 10, fontSize: 13 }}>
              Try a product:{" "}
              <Link href={`/demo/product/${c.topic}-001`}>{c.topic}-001</Link>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, fontSize: 14 }}>
        Next: we’ll add product pages and the “Generate Weekly Digest” dashboard.
      </div>
    </main>
  );
}
