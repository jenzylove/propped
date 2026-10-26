"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { PLATFORMS } from "@/lib/platforms";
import PitchBoard from "./PitchBoard";

type Tier = "likely" | "pitch" | "adbuy";
export interface PlanPlacement {
  show: string;
  network: string | null;
  status: string;
  company: string | null;
  poster: string | null;
  why: string;
  send: string;
  pitch: string;
  chance?: { tier: Tier; label: string; why: string };
  recipient?: { greeting: string; line: string; person: string | null; role: string | null; company: string | null };
}
export interface PlanData {
  id: string;
  brand: string;
  summary: string;
  placements: PlanPlacement[];
  ads: {
    platforms: { name: string; url: string; how: string }[];
    genres: string[];
    networks: string[];
    audience: { ages: string[]; gender: string };
    shows: string[];
    note: string;
    setup?: string[];
  };
  createdAt: string;
}

const TIER_COLOR: Record<Tier, string> = { likely: "var(--green)", pitch: "var(--ink-2)", adbuy: "var(--orange)" };

function CopyButton({ text, label, done: doneLabel = "Copied" }: { text: string; label: string; done?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="copy"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        });
      }}
    >
      {done ? doneLabel : label}
    </button>
  );
}

function mailto(p: PlanPlacement, brand: string) {
  const subject = `Free ${brand} product for ${p.show}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(p.pitch)}`;
}

/** Steps to put the brand in front of the same viewers this week, on a self serve TV platform. */
export function AdSetup({ ads }: { ads: PlanData["ads"] }) {
  const setup = ads.setup ?? [];
  return (
    <div className="setup">
      {setup.length > 0 && (
        <>
          <ol className="steps-list">
            {setup.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <CopyButton text={setup.map((s, i) => `${i + 1}. ${s}`).join("\n")} label="Copy these settings" />
        </>
      )}
      <div className="kicker" style={{ marginTop: 26 }}>Where to buy</div>
      {PLATFORMS.map((pl) => (
        <div key={pl.name} style={{ padding: "10px 0" }}>
          <a href={pl.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, fontSize: 18 }}>{pl.name}</a>
          <p className="muted" style={{ margin: "4px 0 0" }}>{pl.how}</p>
        </div>
      ))}
      <div className="kicker" style={{ marginTop: 14 }}>Your customers watch these, live or streaming</div>
      <div style={{ marginTop: 8 }}>{ads.shows.map((g) => <span key={g} className="chip">{g}</span>)}</div>
    </div>
  );
}

/** Each set to pitch is one dropdown row; the first is open. */
export function PlacementDrops({ placements, brand }: { placements: PlanPlacement[]; brand: string }) {
  return (
    <div className="drops">
      {placements.map((p, i) => (
        <details key={p.show} className="drop" open={i === 0}>
          <summary>
            <span className="drop-n">{String(i + 1).padStart(2, "0")}</span>
            <span className="drop-thumb">
              {p.poster && <img src={p.poster} alt="" />}
              <span>
                <span className="drop-t">{p.show}</span>
                <span className="drop-s">
                  {p.chance && <b style={{ color: TIER_COLOR[p.chance.tier] }}>{p.chance.label}</b>}
                  {p.chance && p.network ? " · " : ""}
                  {p.network}
                </span>
              </span>
            </span>
          </summary>
          <div className="drop-body">
            {p.chance && <p className="muted" style={{ margin: "0 0 14px" }}>{p.chance.why}</p>}
            {p.recipient && (
              <>
                <div className="kicker">Send to</div>
                <p style={{ margin: "4px 0 14px", fontWeight: 600 }}>{p.recipient.line}</p>
              </>
            )}
            <div className="kicker">Why it fits</div>
            <p style={{ margin: "4px 0 14px" }}>{p.why}</p>
            <div className="kicker">What to send</div>
            <p style={{ margin: "4px 0 16px", fontWeight: 600 }}>{p.send}</p>
            <div className="kicker">The letter</div>
            <p className="letter">{p.pitch}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <CopyButton text={p.pitch} label="Copy the letter" />
              <a className="copy ghost" href={mailto(p, brand)}>Email it</a>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

export function PlanView({ plan, board = true }: { plan: PlanData; board?: boolean }) {
  return (
    <>
      <section style={{ marginTop: 56 }}>
        <p className="tape">Step 1 · Guaranteed</p>
        <h2 className="display" style={{ fontSize: "clamp(32px, 4.6vw, 56px)", marginTop: 16 }}>On TV this week</h2>
        <p className="muted" style={{ maxWidth: 720, marginTop: 10 }}>
          Put {plan.brand} in front of the same viewers with a self serve TV campaign. These are the settings to enter.
        </p>
        <AdSetup ads={plan.ads} />
      </section>
      <section style={{ marginTop: 64 }}>
        <p className="tape">Step 2 · Free placement</p>
        <h2 className="display" style={{ fontSize: "clamp(32px, 4.6vw, 56px)", marginTop: 16 }}>Pitch these sets</h2>
        <p className="muted" style={{ maxWidth: 720, marginTop: 10 }}>
          {plan.placements.length
            ? "Shows still filming, most likely to take free product first. Each letter is addressed to the people who dress the set."
            : "None of your customers’ shows are realistic for free placement right now. Start with the TV campaign above."}
        </p>
        {plan.placements.length > 0 && <PlacementDrops placements={plan.placements} brand={plan.brand} />}
      </section>
      {board && plan.placements.length > 0 && (
        <section style={{ marginTop: 64 }}>
          <p className="tape">Step 3 · Follow up</p>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.6vw, 56px)", marginTop: 16, marginBottom: 18 }}>Track your pitches</h2>
          <PitchBoard planId={plan.id} shows={plan.placements.map((p) => p.show)} />
        </section>
      )}
    </>
  );
}

export function ShareLink({ id }: { id: string }) {
  return (
    <section style={{ marginTop: 64 }}>
      <h2 className="display" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>Share this plan</h2>
      <p className="muted" style={{ marginTop: 8 }}>Anyone with the link sees this plan and its pitch board.</p>
      <CopyLink id={id} />
    </section>
  );
}

function CopyLink({ id }: { id: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="copy"
      onClick={() => {
        void navigator.clipboard?.writeText(`${window.location.origin}/plan/${id}`).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        });
      }}
    >
      {done ? "Link copied" : "Copy link to this plan"}
    </button>
  );
}
