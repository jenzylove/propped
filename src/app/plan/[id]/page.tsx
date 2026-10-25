import Link from "next/link";
import type { Metadata } from "next";
import { head } from "@vercel/blob";
import { PlanView, type PlanData } from "../PlanView";

export const dynamic = "force-dynamic";

async function load(id: string): Promise<PlanData | null> {
  if (!/^[a-z0-9-]{3,60}$/.test(id)) return null;
  try {
    const meta = await head(`plans/${id}.json`);
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as PlanData;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const plan = await load((await params).id);
  return { title: plan ? `${plan.brand} plan · Propped` : "Plan not found · Propped" };
}

export default async function SavedPlan({ params }: { params: Promise<{ id: string }> }) {
  const plan = await load((await params).id);
  if (!plan) {
    return (
      <main className="wrap" style={{ paddingTop: 56 }}>
        <h1 className="display" style={{ fontSize: "clamp(36px, 6vw, 68px)" }}>We can’t find that plan</h1>
        <p className="muted" style={{ fontSize: 20, marginTop: 14 }}>The link may be wrong, or the plan was never saved.</p>
        <Link href="/" className="btn" style={{ marginTop: 24 }}>Try a brand</Link>
      </main>
    );
  }
  return (
    <main className="wrap" style={{ paddingTop: 56 }}>
      <Link href="/" className="muted" style={{ fontSize: 14 }}>Back to the shows</Link>
      <h1 className="display" style={{ fontSize: "clamp(36px, 6vw, 68px)", marginTop: 12 }}>Getting {plan.brand} on screen</h1>
      <p className="muted" style={{ fontSize: 20, maxWidth: 720, marginTop: 14 }}>{plan.summary}</p>
      <PlanView plan={plan} />
    </main>
  );
}
