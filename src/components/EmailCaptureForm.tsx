"use client";

import { useState } from "react";
import { setActiveEmail } from "@/lib/client/user"; // ✅ changed

export default function EmailCaptureForm(props: { onSaved?: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    const v = email.trim().toLowerCase();
    if (!v.includes("@")) {
      setMsg("Please enter a valid email.");
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      const res = await fetch("/api/profiles/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setMsg(json?.error ?? `Failed (${res.status})`);
        return;
      }

      setActiveEmail(v); // ✅ changed
      props.onSaved?.(v);
      setMsg("Saved! Now go to Demo Store and click around.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="h2">Set your demo email</div>
      <p className="muted" style={{ marginTop: 8 }}>
        This email acts as the “user identity” for tracking events in Klaviyo.
      </p>

      <div className="row" style={{ marginTop: 10 }}>
        <input
          className="input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ maxWidth: 420 }}
        />
        <button className="btn" onClick={submit} disabled={busy}>
          {busy ? "Saving..." : "Save & Upsert Profile"}
        </button>
      </div>

      {msg ? <p className="muted" style={{ marginTop: 10 }}>{msg}</p> : null}
    </div>
  );
}
