// src/app/demo/products/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { findDemoProduct } from "@/lib/demo/catalog";
import { AutoTrackProductView } from "@/components/Trackers";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const p = findDemoProduct(slug);
  if (!p) return notFound();

  return (
    <main>
      <AutoTrackProductView
        productId={p.productId}
        productName={p.productName}
        price={p.price}
        topic={p.topic}
      />

      <div className="card">
        <Link className="btnSecondary" href="/demo">
          ← Back to Demo Store
        </Link>

        <h1 className="h1" style={{ marginTop: 12 }}>
          {p.productName}
        </h1>

        <div className="row" style={{ marginTop: 10 }}>
          <span className="tag">Topic: {p.topic}</span>
          <span className="tag">${p.price.toFixed(2)}</span>
          <span className="tag">ID: {p.productId}</span>
        </div>

        <p className="muted" style={{ marginTop: 12 }}>
          {p.description}
        </p>

        <img
          src="/demo/placeholder-product.png"
          alt="product"
          style={{ width: "100%", maxWidth: 720, marginTop: 14, borderRadius: 10 }}
        />
      </div>
    </main>
  );
}
