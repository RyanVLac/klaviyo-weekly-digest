"use client";

type Digest = any;
type AiDigest = any;

export default function DigestPreview(props: {
  digest: Digest | null;
  aiDigest: AiDigest | null;
  aiUsed: boolean;
}) {
  const d = props.digest;
  const ai = props.aiDigest;

  if (!d) return <div className="card">No digest yet.</div>;

  return (
    <div className="card">
      <div className="h2">Weekly Digest</div>
      <p className="muted" style={{ marginTop: 6 }}>
        Period: {d.period?.sinceISO} → {d.period?.untilISO}
      </p>

      <hr className="sep" />

      <div className="grid2">
        <div className="card">
          <div className="h2">Deterministic summary</div>
          <div className="kv" style={{ marginTop: 10 }}>
            <div className="muted">Page Views</div><div>{d.stats?.pageViews ?? 0}</div>
            <div className="muted">Product Views</div><div>{d.stats?.productViews ?? 0}</div>
            <div className="muted">Total Dwell</div><div>{d.stats?.totalDwellSeconds ?? 0}s</div>
          </div>

          <p className="muted" style={{ marginTop: 12 }}>
            {d.narrative}
          </p>
        </div>

        <div className="card">
          <div className="h2">AI Digest</div>
          <p className="muted" style={{ marginTop: 6 }}>
            AI used: <b>{props.aiUsed ? "Yes" : "No"}</b>
          </p>

          {ai ? (
            <>
              <h3 style={{ marginTop: 10, marginBottom: 6 }}>{ai.headline}</h3>
              <p className="muted" style={{ lineHeight: 1.6 }}>{ai.summary}</p>
            </>
          ) : (
            <p className="muted" style={{ marginTop: 10 }}>
              AI digest not available (missing key or call failed).
            </p>
          )}
        </div>
      </div>

      <hr className="sep" />

      <div className="grid2">
        <div className="card">
          <div className="h2">Top Topics</div>
          <div style={{ marginTop: 10 }}>
            {(d.topTopics ?? []).map((t: any) => (
              <div key={t.topic} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <b>{t.topic}</b>
                  <span className="muted">score: {t.score}</span>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  pageViews={t.pageViews} • productViews={t.productViews} • dwell={t.dwellSeconds}s
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="h2">Recommendations</div>

          {ai?.recommendedProducts?.length ? (
            <div style={{ marginTop: 10 }}>
              {ai.recommendedProducts.map((p: any, idx: number) => (
                <div key={`${p.productId ?? "null"}-${idx}`} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    {p.productId ? (
                      <a href={`/demo/products/${p.productId}`}><b>{p.productName}</b></a>
                    ) : (
                      <b>{p.productName}</b>
                    )}
                    <span className="muted">{p.productId ? "demo link" : "suggestion"}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>{p.reason}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 10 }}>
              No recommendations yet — view a few product pages in the Demo Store.
            </p>
          )}
        </div>
      </div>

      {ai?.inferredTopics?.length ? (
        <>
          <hr className="sep" />
          <div className="card">
            <div className="h2">AI Inferred Topics</div>
            <div style={{ marginTop: 10 }}>
              {ai.inferredTopics.map((t: any, idx: number) => (
                <div key={`${t.topic}-${idx}`} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <b>{t.topic}</b>
                    <span className="muted">{Math.round((t.confidence ?? 0) * 100)}%</span>
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>{t.evidence}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
