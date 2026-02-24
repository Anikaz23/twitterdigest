import Link from "next/link";
import SetupBanner from "@/components/setup-banner";
import TopNavLinks from "@/components/top-nav-links";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand-title">
            Digest
          </Link>
          <nav className="nav-links">
            <TopNavLinks />
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
  );
}
