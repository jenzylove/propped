import Link from "next/link";

/** A clapperboard whose board is the letter P: the scene is about to start. */
export function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <g transform="rotate(-20 5 12)">
        <rect x="5" y="7" width="23" height="5" rx="0.8" fill="var(--green)" />
        <path d="M9.5 7h3.2l-2.4 5H7.1zM16 7h3.2l-2.4 5h-3.2zM22.5 7h3.2l-2.4 5h-3.2z" fill="currentColor" />
      </g>
      <path fillRule="evenodd" clipRule="evenodd" d="M5 14h13.5a7 7 0 0 1 0 14H11v3H5zm6 4.6v4.8h7.3a2.4 2.4 0 0 0 0-4.8z" fill="currentColor" />
    </svg>
  );
}

export const REPO = "https://github.com/jenzylove/propped";
export const SAMPLE = "/plan/parachute-gz743";

export function Header() {
  return (
    <div className="wrap" style={{ position: "sticky", top: 0, zIndex: 20 }}>
      <header className="glass mast" style={{ borderRadius: 999 }}>
        <Link href="/" className="brand">
          <Mark />
          Propped
        </Link>
        <nav>
          <Link href="/#how" className="hide-sm">How it works</Link>
          <Link href={SAMPLE} className="hide-sm">Sample plan</Link>
          <a href={REPO} target="_blank" rel="noopener noreferrer" className="hide-sm">GitHub</a>
          <Link href="/app" className="cta">Open the app</Link>
        </nav>
      </header>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <Link href="/" className="brand-lg">
              <Mark />
              Propped
            </Link>
            <p className="muted">
              See the TV shows your customers actually watch, then get your product on those sets. Built on Qloo taste data.
            </p>
            <Link href="/app" className="btn" style={{ marginTop: 18 }}>Find my shows</Link>
          </div>
          <nav className="foot-col" aria-label="Product">
            <span className="kicker">Product</span>
            <Link href="/app">Find your shows</Link>
            <Link href={SAMPLE}>Sample plan</Link>
            <Link href="/method">How it works</Link>
            <Link href="/#faq">Questions</Link>
          </nav>
          <nav className="foot-col" aria-label="Data">
            <span className="kicker">Data</span>
            <a href="https://www.qloo.com" target="_blank" rel="noopener noreferrer">Qloo taste data</a>
            <a href="https://www.tvmaze.com" target="_blank" rel="noopener noreferrer">TVmaze show facts</a>
            <a href="https://www.wikipedia.org" target="_blank" rel="noopener noreferrer">Wikipedia studios</a>
          </nav>
          <nav className="foot-col" aria-label="Project">
            <span className="kicker">Project</span>
            <a href={REPO} target="_blank" rel="noopener noreferrer">Source code</a>
            <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">MIT license</a>
            <a href="https://www.universalads.com/" target="_blank" rel="noopener noreferrer">Universal Ads</a>
            <a href="https://advertising.amazon.com/solutions/products/streaming-tv-ads" target="_blank" rel="noopener noreferrer">Amazon streaming TV ads</a>
          </nav>
        </div>
        <div className="foot-bar">
          <span>© 2026 Propped</span>
          <span>Propped never contacts anyone for you. No personal data is used.</span>
        </div>
        <div className="foot-word" aria-hidden="true">Propped</div>
      </div>
    </footer>
  );
}
