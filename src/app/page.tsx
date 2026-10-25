"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { statusStyle, type Status } from "./shared";

interface Show {
  id: string;
  name: string;
  specific: boolean;
  info: { status: Status; network: string | null; poster: string | null; url: string | null } | null;
  match: { label: "the same people" | "close" | "different" } | null;
}
interface ShowsData {
  brand: { name: string } | null;
  shows: Show[];
  calls: unknown[];
}
interface CompareData {
  answer: string;
  refused: boolean;
  shows: string[];
}

const EXAMPLES = ["Liquid Death", "Parachute", "Athletic Brewing", "Dr. Squatch"];

function fitLine(l: string | undefined) {
  if (l === "the same people") return { t: "Same audience as yours", c: "var(--green)" };
  if (l === "close") return { t: "Close to your audience", c: "var(--ink-2)" };
  if (l === "different") return { t: "Broader audience than yours", c: "var(--ink-3)" };
  return null;
}

const STEPS = [
  ["Read your customers’ taste", "Qloo shows what people who love your brand also love."],
  ["Rank the shows for your brand", "Shows that fit you, not shows everyone watches."],
  ["Get on set or on air", "A placement pack and an ad plan, ready to use."],
];

export default function Home() {
  const [input, setInput] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "notfound" | "error">("idle");
  const [shows, setShows] = useState<ShowsData | null>(null);
  const [cmp, setCmp] = useState<CompareData | null>(null);
  const [err, setErr] = useState("");
  const [secs, setSecs] = useState(0);
  const resRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  const run = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const my = ++seq.current;
    setInput(q);
    setState("loading");
    setShows(null);
    setCmp(null);
    window.history.replaceState(null, "", `/?brand=${encodeURIComponent(q)}`);
    setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    const t0 = Date.now();
    const cmpP = fetch(`/api/compare?brand=${encodeURIComponent(q)}`)
      .then((r) => (r.ok ? (r.json() as Promise<CompareData>) : null))
      .catch(() => null);
    try {
      const r = await fetch(`/api/shows?brand=${encodeURIComponent(q)}`);
      const j = await r.json().catch(() => ({}));
      if (my !== seq.current) return;
      if (r.status === 404) {
        setErr(j.error || "We couldn’t find that brand.");
        setState("notfound");
        return;
      }
      if (!r.ok) {
        setState("error");
        return;
      }
      setSecs(Math.max(1, Math.round((Date.now() - t0) / 1000)));
      setShows(j);
      setState("done");
      const c = await cmpP;
      if (my === seq.current) setCmp(c);
    } catch {
      if (my === seq.current) setState("error");
    }
  }, []);

  useEffect(() => {
    const b = new URLSearchParams(window.location.search).get("brand");
    if (b) void run(b);
  }, [run]);

  const brandName = shows?.brand?.name ?? input;

  return (
    <main>
      <section className="wrap" style={{ paddingTop: 72, paddingBottom: 28 }}>
        <h1 className="display" style={{ fontSize: "clamp(42px, 8vw, 92px)", maxWidth: 900 }}>
          Which shows do your customers watch?
        </h1>
        <p className="muted" style={{ fontSize: 20, maxWidth: 640, marginTop: 20 }}>
          Type your brand. Propped reads what your customers love and shows you the TV they watch, then helps you get your product on set.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(input);
          }}
          style={{ display: "flex", gap: 12, marginTop: 30, maxWidth: 720, flexWrap: "wrap" }}
        >
          <input
            aria-label="Your brand"
            placeholder="Your brand"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flex: "1 1 280px", fontSize: 22, padding: "16px 20px", borderRadius: 16, fontWeight: 500 }}
          />
          <button className="btn" type="submit" disabled={state === "loading" || !input.trim()} style={{ padding: "16px 26px", fontSize: 18 }}>
            Find my shows
          </button>
        </form>
        <div style={{ marginTop: 16 }}>
          {EXAMPLES.map((x) => (
            <button key={x} className="chip" style={{ cursor: "pointer", fontSize: 14, padding: "6px 14px" }} onClick={() => void run(x)}>
              {x}
            </button>
          ))}
        </div>
      </section>

      <div ref={resRef} style={{ scrollMarginTop: 80 }}>
        {state === "loading" && (
          <section className="wrap" style={{ paddingTop: 24 }}>
            <p className="muted" style={{ fontSize: 18, fontWeight: 600 }}>
              Reading what your customers love…
            </p>
            <div className="wall" style={{ marginTop: 16 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i}>
                  <div className="poster skel" />
                  <div className="skel" style={{ height: 16, width: "70%", marginTop: 12, borderRadius: 8 }} />
                </div>
              ))}
            </div>
          </section>
        )}

        {state === "notfound" && (
          <section className="wrap" style={{ paddingTop: 24 }}>
            <p style={{ fontSize: 22, fontWeight: 700 }}>{err}</p>
            <p className="muted">Try a brand your customers also buy.</p>
            <div style={{ marginTop: 12 }}>
              {EXAMPLES.map((x) => (
                <button key={x} className="chip" style={{ cursor: "pointer", fontSize: 14, padding: "6px 14px" }} onClick={() => void run(x)}>
                  {x}
                </button>
              ))}
            </div>
          </section>
        )}

        {state === "error" && (
          <section className="wrap" style={{ paddingTop: 24 }}>
            <p style={{ fontSize: 22, fontWeight: 700 }}>Couldn’t read the taste data right now. Try again.</p>
            <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => void run(input)}>
              Try again
            </button>
          </section>
        )}

        {state === "done" && shows && (
          <section className="wrap" style={{ paddingTop: 24 }}>
            <h2 className="display" style={{ fontSize: "clamp(30px, 5vw, 52px)" }}>
              {brandName} customers watch these shows
            </h2>
            <p className="faint mono" style={{ fontSize: 13, marginTop: 10 }}>
              {shows.shows.length} shows · ranked for your brand · {shows.calls.length} Qloo calls
            </p>
            <div className="wall" style={{ marginTop: 24 }}>
              {shows.shows.map((s, i) => {
                const st = statusStyle(s.info?.status);
                const fit = fitLine(s.match?.label);
                const inner = (
                  <>
                    <div className="poster">
                      {s.info?.poster ? (
                        <img src={s.info.poster} alt={`${s.name} poster`} loading="lazy" />
                      ) : (
                        <div className="glass noposter">{s.name}</div>
                      )}
                      <div className="overlay">
                        <span className="pill glass" style={{ color: st.color, padding: "4px 10px", fontSize: 12, borderRadius: 999 }}>
                          <span className="dot" style={{ background: st.color, width: 7, height: 7 }} />
                          {st.label}
                        </span>
                        {s.info?.network && (
                          <span className="pill glass" style={{ padding: "4px 10px", fontSize: 12, borderRadius: 999 }}>
                            {s.info.network}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ marginTop: 10, fontWeight: 600, lineHeight: 1.25 }}>{s.name}</div>
                    {s.specific && (
                      <span className="stamp v-fits" style={{ marginTop: 6, fontSize: 12, padding: "2px 9px" }}>
                        Made for you
                      </span>
                    )}
                    {fit && <div style={{ color: fit.c, fontSize: 13, fontWeight: 600, marginTop: 4 }}>{fit.t}</div>}
                  </>
                );
                const style = { animationDelay: `${i * 40}ms` };
                return s.info?.url ? (
                  <a key={s.id} className="tile rise" style={style} href={s.info.url} target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                ) : (
                  <div key={s.id} className="tile rise" style={style}>
                    {inner}
                  </div>
                );
              })}
            </div>

            <div className="split">
              <div className="glass" style={{ padding: 24, opacity: cmp ? 1 : 0.7 }}>
                <span className="kicker" style={{ color: "var(--orange)", fontWeight: 600 }}>
                  AI alone
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: "6px 0 12px" }}>We asked an AI the same question</h3>
                {!cmp ? (
                  <p className="muted">Asking…</p>
                ) : (
                  <>
                    <blockquote className="muted" style={{ margin: 0, fontStyle: "italic" }}>
                      “{cmp.answer}”
                    </blockquote>
                    {cmp.refused ? (
                      <p style={{ marginTop: 12, fontWeight: 600, color: "var(--orange)" }}>It couldn’t answer. This data isn’t in its training.</p>
                    ) : (
                      <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                        {cmp.shows.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
              <div className="glass" style={{ padding: 24, background: "var(--green-soft)" }}>
                <span className="kicker" style={{ color: "var(--green)", fontWeight: 600 }}>
                  Propped, with Qloo
                </span>
                <p className="display" style={{ fontSize: 34, marginTop: 10, lineHeight: 1.1 }}>
                  {shows.shows.length} shows found in {secs}s
                </p>
                <p className="muted" style={{ marginTop: 8 }}>
                  Ranked for {brandName}, with real show status and network.
                </p>
              </div>
            </div>

            <div style={{ textAlign: "center", margin: "48px 0 8px" }}>
              <Link className="btn" href={`/plan?brand=${encodeURIComponent(brandName)}`} style={{ fontSize: 20, padding: "18px 34px" }}>
                Get on these shows
              </Link>
            </div>
          </section>
        )}
      </div>

      <section className="wrap" style={{ paddingTop: 80 }}>
        <div className="steps">
          {STEPS.map(([t, d], i) => (
            <div key={t}>
              <span className="kicker">Step {i + 1}</span>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: "6px 0" }}>{t}</h3>
              <p className="muted" style={{ margin: 0 }}>
                {d}
              </p>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 40, fontSize: 20, fontWeight: 600, maxWidth: 720 }}>
          <Link href="/proof">Asked which shows a brand’s customers watch, an AI alone refused for 7 of 8 brands.</Link>
        </p>
      </section>
    </main>
  );
}
