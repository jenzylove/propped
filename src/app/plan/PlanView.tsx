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
  site?: string | null;
  declined?: boolean;
  replacedBy?: string;
  replaces?: string;
  followUp?: string;
  replyNote?: string;
  watch?: string;
  onScreen?: string;
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
  moves?: { at: string; show: string; kind: string; summary: string }[];
  createdAt: string;
}

const TIER_COLOR: Record<Tier, string> = { likely: "var(--green)", pitch: "var(--ink-2)", adbuy: "var(--orange)" };
const UNIVERSAL = PLATFORMS[0];

function CopyButton({ text, label }: { text: string; label: string }) {
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
      {done ? "Copied" : label}
    </button>
  );
}

const officeSearch = (p: PlanPlacement) =>
  `https://www.google.com/search?q=${encodeURIComponent(`${p.recipient?.company ?? p.company ?? p.show} ${p.recipient?.company || p.company ? "" : "TV show "}production office contact`)}`;

/** Steps to put the brand in front of the same viewers on a self serve TV platform. */
export function AdSetup({ ads }: { ads: PlanData["ads"] }) {
  const setup = ads.setup ?? [];
  return (
    <div className="setup">
      {setup.length > 0 && (
        <ol className="steps-list">
          {setup.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      )}
      <a className="copy" href={UNIVERSAL.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", textDecoration: "none" }}>
        Open Universal Ads
      </a>
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

function Note({ title, text, copy }: { title: string; text: string; copy?: string }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div className="kicker" style={{ color: "var(--green)" }}>{title}</div>
      <p className="letter">{text}</p>
      {copy && <CopyButton text={text} label={copy} />}
    </div>
  );
}

/** Each set to pitch is one dropdown row; the first live one is open. */
export function PlacementDrops({ placements }: { placements: PlanPlacement[]; brand?: string }) {
  const firstLive = placements.findIndex((p) => !p.declined);
  return (
    <div className="drops">
      {placements.map((p, i) => (
        <details key={p.show} className="drop" open={i === firstLive}>
          <summary>
            <span className="drop-n">{String(i + 1).padStart(2, "0")}</span>
            <span className="drop-thumb" style={p.declined ? { opacity: 0.45 } : undefined}>
              {p.poster && <img src={p.poster} alt="" />}
              <span>
                <span className="drop-t">{p.show}</span>
                <span className="drop-s">
                  {p.declined ? (
                    <b style={{ color: "var(--orange)" }}>{p.replacedBy ? `Declined, swapped for ${p.replacedBy}` : "Declined"}</b>
                  ) : (
                    <>
                      {p.chance && <b style={{ color: TIER_COLOR[p.chance.tier] }}>{p.chance.label}</b>}
                      {p.chance && p.network ? " · " : ""}
                      {p.network}
                      {p.replaces ? ` · replaces ${p.replaces}` : ""}
                    </>
                  )}
                </span>
              </span>
            </span>
          </summary>
          <div className="drop-body">
            {p.chance && !p.declined && <p className="muted" style={{ margin: "0 0 14px" }}>{p.chance.why}</p>}
            {p.recipient && (
              <>
                <div className="kicker">Send to</div>
                <p style={{ margin: "4px 0 6px", fontWeight: 600 }}>{p.recipient.line}</p>
                <p style={{ margin: "0 0 14px", fontSize: 15 }}>
                  {p.site && (
                    <>
                      <a href={p.site} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontWeight: 700, textDecoration: "underline" }}>
                        {p.recipient.company ?? "Their"} website ↗
                      </a>
                      {" · "}
                    </>
                  )}
                  <a href={officeSearch(p)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontWeight: 700, textDecoration: "underline" }}>
                    Find their production office ↗
                  </a>
                </p>
              </>
            )}
            <div className="kicker">Why it fits</div>
            <p style={{ margin: "4px 0 14px" }}>{p.why}</p>
            <div className="kicker">What to send</div>
            <p style={{ margin: "4px 0 16px", fontWeight: 600 }}>{p.send}</p>
            <div className="kicker">The letter</div>
            <p className="letter">{p.pitch}</p>
            <CopyButton text={p.pitch} label="Copy the letter" />
            {p.followUp && <Note title="Follow up, written by the agent" text={p.followUp} copy="Copy the follow up" />}
            {p.replyNote && <Note title="Your answer to their reply" text={p.replyNote} copy="Copy the answer" />}
            {p.watch && <Note title="When to watch" text={p.watch} />}
            {p.onScreen && <Note title="You made it" text={p.onScreen} />}
          </div>
        </details>
      ))}
    </div>
  );
}

export function PlanView({ plan: initial, board = true }: { plan: PlanData; board?: boolean }) {
  const [plan, setPlan] = useState(initial);
  return (
    <>
      <section style={{ marginTop: 56 }}>
        <p className="tape">Step 1 · Guaranteed</p>
        <h2 className="display" style={{ fontSize: "clamp(32px, 4.6vw, 56px)", marginTop: 16 }}>On TV this week</h2>
        <p className="muted" style={{ maxWidth: 720, marginTop: 10 }}>
          Put {plan.brand} in front of the same viewers with a self serve TV campaign. These are the choices to make in Universal Ads.
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
        {plan.placements.length > 0 && <PlacementDrops placements={plan.placements} />}
      </section>
      {board && plan.placements.length > 0 && (
        <section style={{ marginTop: 64 }}>
          <p className="tape">Step 3 · The agent keeps going</p>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.6vw, 56px)", marginTop: 16, marginBottom: 18 }}>Track it, then take the next move</h2>
          <PitchBoard
            key={plan.placements.map((p) => p.show).join("|")}
            planId={plan.id}
            shows={plan.placements.filter((p) => !p.declined).map((p) => p.show)}
            onNext={(r) => setPlan(r.plan as PlanData)}
          />
          {plan.moves && plan.moves.length > 0 && (
            <div style={{ marginTop: 28, maxWidth: 820 }}>
              <div className="kicker">What the agent has done</div>
              <ol className="steps-list" style={{ marginTop: 10 }}>
                {plan.moves.map((m, i) => (
                  <li key={i}>{m.summary}</li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}
    </>
  );
}

export function ShareLink({ id }: { id: string }) {
  const [done, setDone] = useState(false);
  return (
    <section style={{ marginTop: 64 }}>
      <h2 className="display" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>Share this plan</h2>
      <p className="muted" style={{ marginTop: 8 }}>Anyone with the link sees this plan, its pitch board and what the agent has done.</p>
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
    </section>
  );
}
