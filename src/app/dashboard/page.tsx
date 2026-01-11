"use client";

import { useEffect, useMemo, useState } from "react";

type DigestResponse = {
  ok: boolean;
  error?: string;
  email?: string;
  profileId?: string;
  digest?: any;
  meta?: { fetchedEvents: number };
  klaviyoStatus?: number;
  klaviyoBody?: string;
};

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<DigestResponse | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("kwd_email") || "";
    setEmail(saved);
  }, []);

  const hasEmail = useMemo(() => !!email.trim(), [email]);

  async function generate() {
    if (!hasEmail) return;

    setLoading(true);
    setResp(null);

    try {
      const r = await fetch("/api/digest/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, days: 7 }),
      });

      const data = (await r.json()) as DigestResponse;
      setResp(data);
    } catch (e) {
      setResp({ ok: false, error: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1>Klaviyo Weekly Digest — Dashboard</h1>

      <p>
        This pulls your last 7 days of <b>Page Viewed</b> + <b>Product Viewed</b> events from Klaviyo,
        then generates a digest.
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
        <input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            window.localStorage.setItem("kwd_email", e.target.value);
          }}
          placeholder="you@example.com"
          style={{ width: 380, padding: 10 }}
        />
        <button disabled={!hasEmail || loading} onClick={generate} style={{ padding: "10px 14px" }}>
          {loading ? "Generating..." : "Generate Digest"}
        </button>
      </div>

      {!hasEmail && (
        <p style={{ marginTop: 10 }}>
          No email saved yet — go to <a href="/signup">/signup</a> first or type one above.
        </p>
      )}

      {resp && (
        <section style={{ marginTop: 18 }}>
          {!resp.ok ? (
            <>
              <h2 style={{ color: "crimson" }}>Error</h2>
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {JSON.stringify(resp, null, 2)}
              </pre>
              <p>
                If you just tracked events, Klaviyo may take a moment to make them available via GET.
                Try again in ~20–60 seconds.
              </p>
            </>
          ) : (
            <>
              <h2>Digest</h2>
              <p>
                <b>Email:</b> {resp.email} <br />
                <b>Profile:</b> {resp.profileId} <br />
                <b>Fetched events:</b> {resp.meta?.fetchedEvents ?? "?"}
              </p>

              <h3>Summary</h3>
              <p>{resp.digest?.narrative}</p>

              <h3>Stats</h3>
              <pre>{JSON.stringify(resp.digest?.stats, null, 2)}</pre>

              <h3>Top Topics</h3>
              <pre>{JSON.stringify(resp.digest?.topTopics, null, 2)}</pre>

              <h3>Top Products</h3>
              <pre>{JSON.stringify(resp.digest?.topProducts, null, 2)}</pre>
            </>
          )}
        </section>
      )}
    </main>
  );
}
