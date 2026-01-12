"use client";

import Link from "next/link";
import { getActiveEmail, clearActiveEmail } from "@/lib/client/user";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(getActiveEmail());
  }, []);

  return (
    <div className="nav">
      <div className="navInner">
        <div className="brand">
          <Link href="/" style={{ textDecoration: "none" }}>
            Klaviyo Weekly Digest
          </Link>
          <span className="pill">Hackathon Demo</span>
        </div>

        <div className="navLinks">
          <Link href="/signup">Signup</Link>
          <Link href="/demo">Demo Store</Link>
          <Link href="/dashboard">Dashboard</Link>

          {email ? (
            <span className="tag" title={email}>
              {email}
              <button
                className="btnSecondary"
                style={{ padding: "6px 10px", marginLeft: 8 }}
                onClick={() => {
                  clearActiveEmail();
                  setEmail(null);
                }}
              >
                Clear
              </button>
            </span>
          ) : (
            <span className="tag">No email set</span>
          )}
        </div>
      </div>
    </div>
  );
}
