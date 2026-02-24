import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";
import SetupBanner from "@/components/setup-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Twitter Digest",
  description: "Your Twitter feed, distilled.",
};

const themeBootstrapScript = `
(() => {
  try {
    const stored = localStorage.getItem("ui-theme");
    const theme = stored === "x" || stored === "twitter" ? stored : "twitter";
    document.documentElement.setAttribute("data-theme", theme);
  } catch {
    document.documentElement.setAttribute("data-theme", "twitter");
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="twitter" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link href="/" className="brand-title">
                Digest
              </Link>
              <nav className="nav-links">
                <Link href="/" className="nav-link">Home</Link>
                <Link href="/history" className="nav-link">History</Link>
                <Link href="/settings" className="nav-link">Settings</Link>
                <ThemeToggle />
              </nav>
            </div>
          </header>

          <main className="content-wrap">
            <div className="page-stack">
              <SetupBanner />
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
