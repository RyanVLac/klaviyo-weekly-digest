// src/app/demo/content/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { findDemoContent } from "@/lib/demo/catalog";
import { AutoTrackPageView } from "@/components/Trackers";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = findDemoContent(slug);
  if (!post) return notFound();

  return (
    <main>
      <AutoTrackPageView title={post.title} topic={post.topic} dwellSeconds={12} />

      <div className="card">
        <Link className="btnSecondary" href="/demo">
          ← Back to Demo Store
        </Link>

        <h1 className="h1" style={{ marginTop: 12 }}>
          {post.title}
        </h1>

        <div className="row" style={{ marginTop: 10 }}>
          <span className="tag">Topic: {post.topic}</span>
        </div>

        <p className="muted" style={{ marginTop: 12 }}>
          {post.excerpt}
        </p>

        <img
          src="/demo/placeholder-article.png"
          alt="article"
          style={{ width: "100%", maxWidth: 720, marginTop: 14, borderRadius: 10 }}
        />
      </div>
    </main>
  );
}
