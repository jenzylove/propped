"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PlanView, ShareLink, type PlanData } from "./PlanView";

interface Step {
  tool: string;
  summary: string;
  ms: number;
}

export default function PlanPage() {
  const [brand, setBrand] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [plan, setPlan] = useState<PlanData | null>(null);
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
          <PlanView plan={plan} />
          <ShareLink id={plan.id} />
        </>
      )}
    </main>
  );
}
