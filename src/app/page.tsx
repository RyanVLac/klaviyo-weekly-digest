import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Klaviyo Weekly Digest</h1>
      <p>Local demo app. Next step: build tracking + digest generator.</p>
      <p>
        <Link href="/signup">Go to Signup</Link>
      </p>
    </main>
  );
}
