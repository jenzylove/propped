"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { statusStyle } from "../shared";

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
    <div className="glass" style={{ padding: 16, marginTop: 10, boxShadow: "none" }}>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "var(--sans)", fontSize: 15 }}>{text}</pre>
      <button
        className="btn ghost"
        style={{ marginTop: 12, padding: "8px 16px", fontSize: 14 }}
        onClick={() => {
          void navigator.clipboard?.writeText(text).then(() => {
            setDone(true);
            setTimeout(() => setDone(false), 1800);
          });
        }}
      >
        {done ? "Copied" : "Copy pitch"}
      </button>
    </div>
  );
}

export function PlanView({ plan }: { plan: PlanData }) {
  return (
    <>
      <section style={{ marginTop: 64 }}>
        <h2 className="display" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>Placement pack</h2>
        {plan.placements.map((p, i) => {
          const st = statusStyle(p.status);
          return (
            <article key={i} className="placement" style={{ marginTop: 36 }}>
              <div className="thumb">
                {p.poster ? <img src={p.poster} alt={`${p.show} poster`} /> : <div className="glass noposter" style={{ fontSize: 14 }}>{p.show}</div>}
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1.15 }}>{p.show}</h3>
                <div style={{ margin: "8px 0 14px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {p.network && <span className="pill glass" style={{ padding: "4px 10px", fontSize: 13, boxShadow: "none" }}>{p.network}</span>}
                  <span className="pill glass" style={{ padding: "4px 10px", fontSize: 13, color: st.color, boxShadow: "none" }}>
                    <span className="dot" style={{ background: st.color, width: 7, height: 7 }} />
                    {st.label}
                  </span>
                  {p.company && <span className="muted" style={{ fontSize: 14 }}>{p.company}</span>}
                </div>
                <div className="kicker">Why it fits</div>
                <p style={{ margin: "4px 0 14px" }}>{p.why}</p>
                <div className="kicker">What to send</div>
                <p style={{ margin: "4px 0 0" }}>{p.send}</p>
                <CopyPitch text={p.pitch} />
              </div>
            </article>
          );
        })}
      </section>

      <section style={{ marginTop: 72 }}>
        <h2 className="display" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>Ad plan</h2>
        <p className="muted" style={{ marginTop: 10, maxWidth: 720 }}>{plan.ads.note}</p>

        <div className="kicker" style={{ marginTop: 24 }}>Audience</div>
        <div style={{ marginTop: 8 }}>
          {plan.ads.audience.ages.map((a) => <span key={a} className="chip">{a}</span>)}
          <span className="chip">{plan.ads.audience.gender}</span>
        </div>
        <div className="kicker" style={{ marginTop: 16 }}>Genres</div>
        <div style={{ marginTop: 8 }}>{plan.ads.genres.map((g) => <span key={g} className="chip">{g}</span>)}</div>
        <div className="kicker" style={{ marginTop: 16 }}>Networks</div>
        <div style={{ marginTop: 8 }}>{plan.ads.networks.map((g) => <span key={g} className="chip">{g}</span>)}</div>

        <div className="kicker" style={{ marginTop: 28 }}>Where to buy</div>
        {plan.ads.platforms.map((pl) => (
          <div key={pl.name} style={{ padding: "12px 0" }}>
            <a href={pl.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, fontSize: 18 }}>{pl.name}</a>
            <p className="muted" style={{ margin: "4px 0 0" }}>{pl.how}</p>
          </div>
        ))}

        <div className="kicker" style={{ marginTop: 20 }}>Based on these shows</div>
        <div style={{ marginTop: 8 }}>{plan.ads.shows.map((g) => <span key={g} className="chip">{g}</span>)}</div>
      </section>
    </>
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
