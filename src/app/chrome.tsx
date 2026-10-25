import Link from "next/link";

export function TvIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <path d="M9 3.5 13 7l4-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2.5" y="7" width="21" height="14" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="5.5" y="10" width="11" height="8" rx="1.5" fill="var(--green)" />
      <circle cx="20" cy="12" r="1.1" fill="currentColor" />
      <circle cx="20" cy="16" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function Header() {
  return (
    <div className="wrap" style={{ position: "sticky", top: 0, zIndex: 20 }}>
      <header className="glass mast" style={{ borderRadius: 999 }}>
        <Link href="/" className="brand">
          <TvIcon />
          Propped
        </Link>
        <nav>
          <Link href="/method">How it works</Link>
          <a href="https://github.com/jenzylove/propped" target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
      </header>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="wrap faint" style={{ padding: "48px 24px 40px", fontSize: 14 }}>
      Taste data from Qloo. Show facts from TVmaze and Wikipedia. Propped never contacts anyone for you.
    </footer>
  );
}
