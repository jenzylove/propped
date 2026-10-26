"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { statusStyle } from "../shared";
import { PLATFORMS } from "@/lib/platforms";

export interface PlanPlacement {
  show: string;
  network: string | null;
  status: string;
  company: string | null;
  poster: string | null;
  why: string;
  send: string;
  pitch: string;
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
  };
  createdAt: string;
}

function CopyPitch({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <>
      <p className="letter">{text}</p>
      <button
        className="copy"
        onClick={() => {
          void navigator.clipboard?.writeText(text).then(() => {
            setDone(true);
            setTimeout(() => setDone(false), 1800);
          });
        }}
      >
        {done ? "Copied" : "Copy the letter"}
      </button>
    </>
  );
}

/** Each placement is one dropdown row; the first is open. */
export function PlacementDrops({ placements, ads }: { placements: PlanPlacement[]; ads?: PlanData["ads"] }) {
  return (
    <div className="drops">
      {placements.map((p, i) => {
        const st = statusStyle(p.status);
        return (
          <details key={p.show} className="drop" open={i === 0}>
            <summary>
              <span className="drop-n">{String(i + 1).padStart(2, "0")}</span>
              <span className="drop-thumb">
                {p.poster && <img src={p.poster} alt="" />}
                <span>
                  <span className="drop-t">{p.show}</span>
                  <span className="drop-s">
                    {[p.network, st.label, p.company].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </span>
            </summary>
            <div className="drop-body">
              <div className="kicker">Why it fits</div>
              <p style={{ margin: "4px 0 14px" }}>{p.why}</p>
              <div className="kicker">What to send</div>
              <p style={{ margin: "4px 0 16px", fontWeight: 600 }}>{p.send}</p>
              <div className="kicker">Pitch letter to the set decoration and props team</div>
              <CopyPitch text={p.pitch} />
            </div>
          </details>
        );
      })}
      {ads && (
        <details className="drop">
          <summary>
            <span className="drop-n">{String(placements.length + 1).padStart(2, "0")}</span>
            <span>
              <span className="drop-t">Ad plan</span>
              <span className="drop-s">The same viewers on self serve TV, from about $100</span>
            </span>
          </summary>
          <div className="drop-body">
            <p className="muted">{ads.note}</p>
            <div className="kicker" style={{ marginTop: 18 }}>Audience</div>
            <div style={{ marginTop: 8 }}>
              {ads.audience.ages.map((a) => <span key={a} className="chip">{a}</span>)}
              <span className="chip">{ads.audience.gender}</span>
            </div>
            <div className="kicker" style={{ marginTop: 14 }}>Genres</div>
            <div style={{ marginTop: 8 }}>{ads.genres.map((g) => <span key={g} className="chip">{g}</span>)}</div>
            <div className="kicker" style={{ marginTop: 14 }}>Networks</div>
            <div style={{ marginTop: 8 }}>{ads.networks.map((g) => <span key={g} className="chip">{g}</span>)}</div>
            <div className="kicker" style={{ marginTop: 22 }}>Where to buy</div>
            {PLATFORMS.map((pl) => (
              <div key={pl.name} style={{ padding: "10px 0" }}>
                <a href={pl.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, fontSize: 18 }}>{pl.name}</a>
                <p className="muted" style={{ margin: "4px 0 0" }}>{pl.how}</p>
              </div>
            ))}
            <div className="kicker" style={{ marginTop: 14 }}>Based on these shows</div>
            <div style={{ marginTop: 8 }}>{ads.shows.map((g) => <span key={g} className="chip">{g}</span>)}</div>
          </div>
        </details>
      )}
    </div>
  );
}

export function PlanView({ plan }: { plan: PlanData }) {
  return (
    <section style={{ marginTop: 56 }}>
      <h2 className="display" style={{ fontSize: "clamp(32px, 4.6vw, 56px)" }}>Placement pack and ad plan</h2>
      <PlacementDrops placements={plan.placements} ads={plan.ads} />
    </section>
  );
}

export function ShareLink({ id }: { id: string }) {
  const [done, setDone] = useState(false);
  const path = `/plan/${id}`;
  return (
    <section style={{ marginTop: 72 }}>
      <h2 className="display" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>Share this plan</h2>
      <div style={{ marginTop: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <a href={path} style={{ fontWeight: 600, wordBreak: "break-all" }}>{path}</a>
        <button
          className="btn ghost"
          style={{ padding: "8px 16px", fontSize: 14 }}
          onClick={() => {
            void navigator.clipboard?.writeText(`${window.location.origin}${path}`).then(() => {
              setDone(true);
              setTimeout(() => setDone(false), 1800);
            });
          }}
        >
          {done ? "Copied" : "Copy link"}
        </button>
      </div>
    </section>
  );
}
