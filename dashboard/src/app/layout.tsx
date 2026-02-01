import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Twitter Digest",
  description: "AI-powered summaries of your Twitter feed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <nav className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-white">
              Twitter Digest
            </Link>
            <div className="flex gap-6">
              <Link
                href="/"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Latest
              </Link>
              <Link
                href="/history"
                className="text-gray-400 hover:text-white transition-colors"
              >
                History
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
