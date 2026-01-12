import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Klaviyo Weekly Digest",
  description: "AI-powered weekly digest from Klaviyo engagement events (demo).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
