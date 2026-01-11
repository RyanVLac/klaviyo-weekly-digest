"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSavedEmail } from "@/lib/client/user";

export default function DemoCategoryPage() {
  const params = useParams();
  const category = (params?.category as string) || "category";
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    // auto-track when you land on the page (nice for demo video)
    const email = getSavedEmail();
    if (!email) return;

    fetch("/api/track/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        urlPath: `/demo/${category}`,
        title: `${category} Category`,
        topic: category,
        dwellSeconds: 15,
      }),
    })
      .then(() => setStatus(`✅ Auto-tracked Page Viewed: ${category}`))
      .catch(() => setStatus("Failed to track."));
  }, [category]);

  return (
    <main style={{ padding: 24 }}>
      <p><Link href="/demo">← Back to Demo</Link></p>
      <h1 style={{ marginBottom: 6 }}>{category} category</h1>
      <p style={{ marginTop: 0, opacity: 0.85 }}>
        This page auto-sends a <b>Page Viewed</b> event on load.
      </p>

      {status ? <div style={{ padding: 12, border: "1px solid #ddd" }}>{status}</div> : null}

      <h2 style={{ marginTop: 20 }}>Products</h2>
      <ul>
        <li><Link href={`/demo/product/${category}-001`}>{category}-001</Link></li>
        <li><Link href={`/demo/product/${category}-002`}>{category}-002</Link></li>
      </ul>
    </main>
  );
}
