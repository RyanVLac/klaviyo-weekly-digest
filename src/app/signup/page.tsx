"use client";

import EmailCaptureForm from "@/components/EmailCaptureForm";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="grid2">
      <div className="card">
        <h1 className="h1">Signup</h1>
        <p className="muted" style={{ marginTop: 10 }}>
          Enter an email to represent a “user” for tracking. We’ll upsert this profile into Klaviyo.
        </p>

        <div style={{ marginTop: 14 }}>
          <EmailCaptureForm />
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <Link className="btnSecondary" href="/demo">Go to Demo Store</Link>
          <Link className="btnSecondary" href="/dashboard">Go to Dashboard</Link>
        </div>
      </div>

      <div className="card">
        <div className="h2">Why email?</div>
        <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
          Klaviyo uses Profiles as identities. For the hackathon demo, an email is an easy, realistic identifier.
          The demo store sends events tied to this profile, then the dashboard pulls the last N days of events.
        </p>
      </div>
    </div>
  );
}
