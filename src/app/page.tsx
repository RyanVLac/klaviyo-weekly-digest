"use client";

import Link from "next/link";
import { getActiveEmail } from "@/lib/client/user";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(getActiveEmail());
  }, []);

  return (
    <div className="grid2">
      <div className="card">
        <h1 className="h1">Weekly Digest from Klaviyo engagement data</h1>
        <p className="muted" style={{ marginTop: 10 }}>
          This demo simulates browsing behavior, tracks it into Klaviyo (Page Viewed / Product Viewed),
          then generates a weekly digest + AI narrative from those events.
        </p>

        <hr className="sep" />

        <div className="h2">Demo flow</div>
        <ol className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
          <li>Set an email (identity) on Signup</li>
          <li>Browse the Demo Store to generate events</li>
          <li>Open Dashboard and generate your digest (deterministic + AI)</li>
        </ol>

        <div className="row" style={{ marginTop: 14 }}>
          <Link className="btn" href="/signup">1) Signup</Link>
          <Link className="btnSecondary" href="/demo">2) Demo Store</Link>
          <Link className="btnSecondary" href="/dashboard">3) Dashboard</Link>
        </div>

        {email ? (
          <p className="muted" style={{ marginTop: 12 }}>
            Current email: <b>{email}</b>
          </p>
        ) : (
          <p className="muted" style={{ marginTop: 12 }}>
            No email set yet — start with <b>Signup</b>.
          </p>
        )}
      </div>

      <div className="card">
        <div className="h2">What’s dynamic (not hardcoded)</div>
        <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
          The demo store is just a sandbox to generate realistic events.
          The dashboard pulls real events back from Klaviyo, aggregates them into stats/topics/products,
          then uses OpenAI to generate a human-friendly weekly summary.
        </p>

        <hr className="sep" />

        <div className="h2">What judges can do</div>
        <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
          They can set an email, click around the demo store for 30 seconds, and generate the digest.
          Everything runs locally except the Klaviyo + OpenAI API calls.
        </p>
      </div>
    </div>
  );
}
