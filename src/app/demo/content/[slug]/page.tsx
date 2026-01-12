import Link from "next/link";
import { notFound } from "next/navigation";
import { demoContent } from "@/lib/demo/catalog";
import { AutoTrackPageView } from "@/components/Trackers";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = demoContent.find((c) => c.slug === slug);
  if (!post) notFound();

  return (
    <div className="card">
      <AutoTrackPageView title={post.title} topic={post.topic} />

      <div className="row" style={{ justifyContent: "space-between" }}>
        <Link className="btnSecondary" href="/demo">
          ← Back to Demo Store
        </Link>
        <span className="tag">Topic: {post.topic}</span>
      </div>

      <h1 className="h1" style={{ marginTop: 12 }}>
        {post.title}
      </h1>
      <p className="muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
        {post.excerpt}
      </p>

      <img
        src="/demo/placeholder-article.png"
        alt="article"
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
