"use client";

import { useEffect, useState } from "react";
import { getActiveEmail, setActiveEmail } from "@/lib/client/user";
import DigestPreview from "@/components/DigestPreview";
import EventDebugTable from "@/components/EventDebugTable";

type DigestResponse = any;

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [resp, setResp] = useState<DigestResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const e = getActiveEmail();
    if (e) setEmail(e);
  }, []);

  async function generate() {
    const v = email.trim().toLowerCase();
    if (!v.includes("@")) {
      setErr("Set a valid email first (Signup).");
      return;
    }

    setBusy(true);
    setErr(null);

    try {
      setActiveEmail(v);

      const r = await fetch("/api/digest/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v, days }),
      });

      const j = await r.json().catch(() => null);
      if (!r.ok) {
        setErr(j?.error ?? `Failed (${r.status})`);
        return;
      }

      setResp(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function simulateActivity() {
    const v = email.trim().toLowerCase();
    if (!v.includes("@")) {
      setErr("Set a valid email first (Signup).");
      return;
    }
    setErr(null);
    setBusy(true);

    try {
      setActiveEmail(v);

      const posts = [
        { url: "/api/track/page-view", body: { email: v, urlPath: "/demo", title: "Demo Store", topic: "boots", dwellSeconds: 10 } },
        { url: "/api/track/page-view", body: { email: v, urlPath: "/demo/content/winter-running-tips", title: "Winter running tips", topic: "running", dwellSeconds: 20 } },
        { url: "/api/track/page-view", body: { email: v, urlPath: "/demo/content/jacket-fit-and-features", title: "Jacket fit & features", topic: "jackets", dwellSeconds: 18 } },
        { url: "/api/track/product-view", body: { email: v, productId: "boot-001", productName: "Classic Leather Boot", price: 129.99, urlPath: "/demo/products/boot-001", title: "Classic Leather Boot", topic: "boots" } },
        { url: "/api/track/product-view", body: { email: v, productId: "jackets-001", productName: "Puffer Rain Jacket", price: 159.99, urlPath: "/demo/products/jackets-001", title: "Puffer Rain Jacket", topic: "jackets" } },
        { url: "/api/track/page-view", body: { email: v, urlPath: "/demo/content/layering-for-snow-days", title: "Layering guide for snow days", topic: "snow", dwellSeconds: 16 } },
      ];

      for (const p of posts) {
        const r = await fetch(p.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p.body),
        });

        if (!r.ok) {
          const j = await r.json().catch(() => null);
          throw new Error(j?.error ?? `Simulate failed (${r.status})`);
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

    return (
    <div className="stack">
      {/* Top controls card */}
      <div className="card">
        <h1 className="h1">Dashboard</h1>
        <p className="muted" style={{ marginTop: 10 }}>
          Pull events from Klaviyo → build digest → generate AI summary.
        </p>

        <hr className="sep" />

        <div className="row">
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="muted" style={{ marginBottom: 6 }}>Email</div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ width: 140 }}>
            <div className="muted" style={{ marginBottom: 6 }}>Days</div>
            <input
              className="input"
              type="number"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </div>

          <button className="btn" onClick={generate} disabled={busy}>
            {busy ? "Working..." : "Generate Digest"}
          </button>

          <button className="btnSecondary" onClick={simulateActivity} disabled={busy}>
            Simulate Activity
          </button>
        </div>

        {err ? <p className="muted" style={{ marginTop: 10 }}>{err}</p> : null}

        <p className="muted" style={{ marginTop: 10 }}>
          Tip: You can also generate events by browsing <b>/demo</b> naturally.
        </p>
      </div>

      {/* Digest section UNDER the dashboard */}
      <DigestPreview
        digest={resp?.digest ?? null}
        aiDigest={resp?.aiDigest ?? null}
        aiUsed={Boolean(resp?.aiUsed)}
      />

      {/* Debug table also under */}
      <div className="card">
        <div className="h2">Raw Events (debug)</div>
        <p className="muted" style={{ marginTop: 8 }}>
          This is only for development/debug during the hackathon.
        </p>
        <hr className="sep" />
        <EventDebugTable events={resp?.normalizedEvents ?? []} />
      </div>
    </div>
  );
}
