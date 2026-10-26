import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readPlan } from "@/lib/store";
import { PlanView, type PlanData } from "../PlanView";

export const dynamic = "force-dynamic";

async function load(id: string): Promise<PlanData | null> {
  if (!/^[a-z0-9-]{3,60}$/.test(id)) return null;
  return (await readPlan(id)) as PlanData | null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const plan = await load((await params).id);
  return { title: plan ? `${plan.brand} plan · Propped` : "Plan not found · Propped" };
}

export default async function SavedPlan({ params }: { params: Promise<{ id: string }> }) {
  const plan = await load((await params).id);
  if (!plan) notFound();
  return (
    <main className="wrap" style={{ paddingTop: 56 }}>
      <Link href={`/app?brand=${encodeURIComponent(plan.brand)}`} className="muted" style={{ fontSize: 14 }}>See {plan.brand}’s shows</Link>
      <h1 className="display" style={{ fontSize: "clamp(36px, 6vw, 68px)", marginTop: 12 }}>Getting {plan.brand} on screen</h1>
      <p className="muted" style={{ fontSize: 20, maxWidth: 720, marginTop: 14 }}>{plan.summary}</p>
      <PlanView plan={plan} />
    </main>
  );
}
