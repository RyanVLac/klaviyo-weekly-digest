// src/app/demo/page.tsx
import Link from "next/link";
import { demoCategories } from "@/lib/demo/catalog";
import { ActiveEmailBanner, TrackPageViewButton } from "@/components/Trackers";

export default function DemoPage() {
  return (
    <main>
      <h1 className="h1">Demo Browse</h1>
      <p className="muted">
        Click categories/products — we’ll send <b>Page Viewed</b> and <b>Product Viewed</b> events into
        Klaviyo.
      </p>

      <ActiveEmailBanner />

      <h2 className="h2" style={{ marginTop: 18 }}>
        Categories
      </h2>

      <div className="grid" style={{ marginTop: 12 }}>
        {demoCategories.map((c) => (
          <div className="card" key={c.slug}>
            <div className="h3">{c.name}</div>
            <div className="muted">{c.blurb}</div>

            <div className="row" style={{ marginTop: 12 }}>
              <TrackPageViewButton title={`${c.name} Category`} topic={c.topic} urlPath={`/demo/${c.slug}`} dwellSeconds={10} />
              <Link className="btnSecondary" href={`/demo/content/${c.sampleContentSlug}`}>
                Open
              </Link>
            </div>

            <div className="muted" style={{ marginTop: 10 }}>
              Try a product:{" "}
              <Link href={`/demo/products/${c.sampleProductSlug}`}>{c.sampleProductSlug}</Link>
            </div>
          </div>
        ))}
      </div>

      <p className="muted" style={{ marginTop: 18 }}>
        Next: go to <Link href="/dashboard">Dashboard</Link> and generate a digest from the last 7 days.
      </p>
    </main>
  );
}
