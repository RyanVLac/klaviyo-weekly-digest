"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSavedEmail, saveEmail, clearEmail } from "@/lib/client/user";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = getSavedEmail();
    if (existing) setEmail(existing);
  }, []);

  async function onSave() {
    setStatus("saving");
    setError(null);

    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      setStatus("error");
      setError("Enter a valid email.");
      return;
    }

    try {
      const res = await fetch("/api/profiles/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: clean,
          preferences: {
            digest_frequency: "weekly",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save email");
      }

      saveEmail(clean);
      setStatus("saved");
      router.push("/demo");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  function onReset() {
    clearEmail();
    setEmail("");
    setStatus("idle");
    setError(null);
  }

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ marginBottom: 8 }}>Klaviyo Weekly Digest</h1>
      <p style={{ marginTop: 0 }}>
        Enter an email to start tracking demo browsing and generating a weekly digest.
      </p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{ padding: 10, flex: 1 }}
        />
        <button onClick={onSave} disabled={status === "saving"} style={{ padding: "10px 14px" }}>
          {status === "saving" ? "Saving..." : "Continue"}
        </button>
        <button onClick={onReset} style={{ padding: "10px 14px" }}>
          Reset
        </button>
      </div>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <div style={{ marginTop: 24, fontSize: 14, opacity: 0.8 }}>
        <p style={{ margin: 0 }}>
          Demo note: this stores your email locally (localStorage) so the demo can track events.
        </p>
      </div>
    </main>
  );
}
