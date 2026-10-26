import Link from "next/link";

export default function PlanNotFound() {
  return (
    <main className="wrap" style={{ paddingTop: 56 }}>
      <h1 className="display" style={{ fontSize: "clamp(36px, 6vw, 68px)" }}>We can’t find that plan</h1>
      <p className="muted" style={{ fontSize: 20, marginTop: 14 }}>The link may be wrong, or the plan was never saved.</p>
      <Link href="/app" className="btn" style={{ marginTop: 24 }}>Try a brand</Link>
    </main>
  );
}
