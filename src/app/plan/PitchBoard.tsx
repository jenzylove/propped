"use client";

import { useEffect, useRef, useState } from "react";
import { STAGES, STAGE_LABELS, type Board, type Stage } from "@/lib/board";

export default function PitchBoard({ planId, shows }: { planId: string; shows: string[] }) {
  const [board, setBoard] = useState<Board>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const seq = useRef<Record<string, number>>({});

  useEffect(() => {
    let live = true;
    fetch(`/api/board/${planId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { board?: Board } | null) => {
        if (live && d?.board) setBoard((cur) => ({ ...d.board, ...cur }));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [planId]);

  const stageOf = (show: string): Stage => board[show] ?? "not_sent";

  async function choose(show: string, stage: Stage) {
    const prev = stageOf(show);
    if (prev === stage) return;
    const n = (seq.current[show] ?? 0) + 1;
    seq.current[show] = n;
    setBoard((b) => ({ ...b, [show]: stage }));
    setErrors((e) => ({ ...e, [show]: false }));
    try {
      const res = await fetch(`/api/board/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show, stage }),
      });
      if (!res.ok) throw new Error("save failed");
    } catch {
      if (seq.current[show] !== n) return;
      setBoard((b) => ({ ...b, [show]: prev }));
      setErrors((e) => ({ ...e, [show]: true }));
    }
  }

  const order = (s: Stage) => STAGES.indexOf(s);
  const total = shows.length;
  const pitched = shows.filter((s) => order(stageOf(s)) >= 1).length;
  const replied = shows.filter((s) => order(stageOf(s)) >= 2).length;
  const shipped = shows.filter((s) => order(stageOf(s)) >= 3).length;
  const onScreen = shows.filter((s) => stageOf(s) === "on_screen").length;
  const parts = [`${pitched} of ${total} pitched`];
  if (replied) parts.push(`${replied} replied`);
  if (shipped) parts.push(`${shipped} shipped`);
  if (onScreen) parts.push(`${onScreen} on screen`);

  return (
    <div style={{ maxWidth: 980 }}>
      <p style={{ fontSize: 16, margin: "0 0 12px" }} aria-live="polite">{parts.join(", ")}</p>
      <div style={{ borderTop: "2px solid var(--ink)" }}>
        {shows.map((show) => {
          const current = stageOf(show);
          return (
            <div key={show} style={{ borderBottom: "1px solid var(--rule)", padding: "14px 0", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 20px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, flex: "1 1 200px", minWidth: 0 }}>{show}</div>
              <div role="group" aria-label={`Stage for ${show}`} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {STAGES.map((s) => {
                  const on = s === current;
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={on}
                      onClick={() => choose(show, s)}
                      style={{
                        font: "inherit",
                        fontSize: 15,
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: `1px solid ${on ? "var(--green)" : "var(--rule)"}`,
                        background: on ? "var(--green)" : "transparent",
                        color: on ? "#fff" : "inherit",
                        cursor: "pointer",
                      }}
                    >
                      {STAGE_LABELS[s]}
                    </button>
                  );
                })}
              </div>
              {errors[show] && (
                <div role="alert" style={{ flexBasis: "100%", fontSize: 15 }}>Couldn’t save, try again</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
