"use client";

export default function EventDebugTable(props: { events: any[] }) {
  const events = props.events ?? [];

  return (
    <div className="card">
      <div className="h2">Debug: normalized events (last {events.length})</div>
      <p className="muted" style={{ marginTop: 6 }}>
        This is the evidence used for the digest and AI.
      </p>

      <div style={{ overflowX: "auto", marginTop: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["type", "ts", "topic", "title", "urlPath", "productId", "productName", "price", "dwellSeconds"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.75)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i}>
                <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{e.type}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{e.ts}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{e.topic ?? "-"}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{e.title ?? "-"}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{e.urlPath ?? "-"}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{e.productId ?? "-"}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{e.productName ?? "-"}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {typeof e.price === "number" ? e.price.toFixed(2) : "-"}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{e.dwellSeconds ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
