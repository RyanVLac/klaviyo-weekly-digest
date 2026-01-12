
import Link from "next/link";
import { notFound } from "next/navigation";
import { demoProducts } from "@/lib/demo/catalog";
import { AutoTrackProductView } from "@/components/Trackers";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const p = demoProducts.find((x) => x.slug === slug);
  if (!p) notFound();

  return (
    <div className="card">
      <AutoTrackProductView
        productId={p.productId}
        productName={p.productName}
        price={p.price}
        topic={p.topic}
      />

      <div className="row" style={{ justifyContent: "space-between" }}>
        <Link className="btnSecondary" href="/demo">
          ← Back to Demo Store
        </Link>
        <span className="tag">Topic: {p.topic}</span>
      </div>

      <h1 className="h1" style={{ marginTop: 12 }}>
        {p.productName}
      </h1>

      <div className="row" style={{ marginTop: 10 }}>
        <span className="tag">${p.price.toFixed(2)}</span>
        <span className="tag">Product ID: {p.productId}</span>
      </div>

      <p className="muted" style={{ marginTop: 12, lineHeight: 1.6 }}>
        {p.description}
      </p>

      <img
        src="/demo/placeholder-product.png"
        alt="product"
        style={{
          width: "100%",
          maxWidth: 820,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.10)",
          marginTop: 14,
        }}
      />
    </div>
  );
}
