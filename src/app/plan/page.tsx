"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { statusStyle } from "../shared";

interface Step {
  tool: string;
  summary: string;
  ms: number;
}
interface Placement {
  show: string;
  network: string;
  status: string;
  company: string;
  poster: string | null;
  why: string;
  send: string;
  pitch: string;
}
interface Plan {
  id: string;
  brand: string;
  summary: string;
  placements: Placement[];
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

export default function PlanPage() {
  const [brand, setBrand] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const started = useRef(false);

  async function run(b: string) {
    setState("running");
    setSteps([]);
    setPlan(null);
    setErr("");
    try {
      const res = await fetch("/api/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ brand: b }) });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error || "Couldn’t build the plan right now. Try again.");
        setState("error");
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let finished = false;
      const handle = (line: string) => {
        if (!line.trim()) return;
        const m = JSON.parse(line);
        if (m.type === "step") setSteps((s) => [...s, m.step]);
        else if (m.type === "done") {
          setPlan(m.plan);
          setState("done");
          finished = true;
        } else if (m.type === "error") {
          setErr(m.message);
          setState("error");
          finished = true;
        }
      };
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        lines.forEach(handle);
      }
      handle(buf);
      if (!finished) {
        setErr("The plan stopped early. Try again.");
        setState("error");
      }
    } catch {
      setErr("Couldn’t build the plan right now. Try again.");
      setState("error");
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const b = new URLSearchParams(window.location.search).get("brand")?.trim() ?? "";
    setBrand(b);
    if (b) void run(b);
  }, []);

  return (
    <main className="wrap" style={{ paddingTop: 56 }}>
      <Link href={brand ? `/?brand=${encodeURIComponent(brand)}` : "/"} className="muted" style={{ fontSize: 14 }}>
        Back to the shows
      </Link>
      <h1 className="display" style={{ fontSize: "clamp(36px, 6vw, 68px)", marginTop: 12 }}>
        Getting {brand || "your brand"} on screen
      </h1>
      {plan && <p className="muted" style={{ fontSize: 20, maxWidth: 720, marginTop: 14 }}>{plan.summary}</p>}

      {!brand && <p className="muted" style={{ marginTop: 20 }}>Pick a brand first.</p>}
      {brand && (
        <div style={{ marginTop: 28, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn" disabled={state === "running"} onClick={() => void run(brand)}>
            {state === "running" ? "Working…" : "Run"}
          </button>
        </div>
      )}

      {steps.length > 0 && (
        <ol style={{ listStyle: "none", padding: 0, margin: "28px 0 0" }}>
          {steps.map((s, i) => (
            <li key={i} className="pop" style={{ display: "flex", gap: 12, padding: "6px 0", alignItems: "baseline" }}>
              <span className="dot" style={{ flex: "none", transform: "translateY(-1px)" }} />
              <span style={{ minWidth: 0 }}>
                <b className="mono" style={{ fontSize: 13 }}>{s.tool}</b> <span className="muted">{s.summary}</span>{" "}
                <span className="faint mono" style={{ fontSize: 12 }}>{(s.ms / 1000).toFixed(1)}s</span>
              </span>
            </li>
          ))}
          {state === "running" && (
            <li className="faint" style={{ padding: "6px 0 6px 20px" }}>Working…</li>
          )}
        </ol>
      )}

      {state === "error" && (
        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 20, fontWeight: 700 }}>{err}</p>
          <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => void run(brand)}>
            Try again
          </button>
        </div>
      )}

      {plan && (
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
                      <span className="pill glass" style={{ padding: "4px 10px", fontSize: 13, boxShadow: "none" }}>{p.network}</span>
                      <span className="pill glass" style={{ padding: "4px 10px", fontSize: 13, color: st.color, boxShadow: "none" }}>
                        <span className="dot" style={{ background: st.color, width: 7, height: 7 }} />
                        {st.label}
                      </span>
                      <span className="muted" style={{ fontSize: 14 }}>{p.company}</span>
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
      )}
    </main>
  );
}
