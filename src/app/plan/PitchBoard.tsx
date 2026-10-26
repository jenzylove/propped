"use client";

import { useEffect, useRef, useState } from "react";
import { STAGES, STAGE_LABELS, type Board, type Stage } from "@/lib/board";

const PITCHED: Stage[] = ["pitched", "no_reply", "declined", "replied", "shipped", "on_screen"];
const REPLIED: Stage[] = ["replied", "shipped", "on_screen"];
const SHIPPED: Stage[] = ["shipped", "on_screen"];

export interface NextResult {
  plan: unknown;
  moves: { show: string; kind: string; summary: string }[];
}

export default function PitchBoard({
  planId,
  shows,
  onNext,
}: {
  planId: string;
  shows: string[];
  onNext?: (r: NextResult) => void;
}) {
  const [board, setBoard] = useState<Board>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);
  const [moves, setMoves] = useState<NextResult["moves"] | null>(null);
  const [failed, setFailed] = useState("");
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
    const nextBoard = { ...board, [show]: stage };
    setBoard(nextBoard);
    setErrors((e) => ({ ...e, [show]: false }));
    try {
      const res = await fetch(`/api/board/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show, stage, board: nextBoard }),
      });
      if (!res.ok) throw new Error("save failed");
    } catch {
      if (seq.current[show] !== n) return;
      setBoard((b) => ({ ...b, [show]: prev }));
      setErrors((e) => ({ ...e, [show]: true }));
    }
  }

  async function next() {
    setRunning(true);
    setFailed("");
    setMoves(null);
    try {
      const res = await fetch(`/api/plan/${planId}/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "The agent couldn't finish its next move. Try again.");
      setMoves(j.moves ?? []);
      onNext?.(j as NextResult);
    } catch (e) {
      setFailed((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  const count = (set: Stage[]) => shows.filter((s) => set.includes(stageOf(s))).length;
  const parts = [`${count(PITCHED)} of ${shows.length} pitched`];
  if (count(REPLIED)) parts.push(`${count(REPLIED)} replied`);
  if (count(["declined"])) parts.push(`${count(["declined"])} declined`);
  if (count(SHIPPED)) parts.push(`${count(SHIPPED)} shipped`);
  if (count(["on_screen"])) parts.push(`${count(["on_screen"])} on screen`);
  const waiting = shows.some((s) => ["no_reply", "declined", "replied", "shipped", "on_screen"].includes(stageOf(s)));

  return (
    <div style={{ maxWidth: 980 }}>
      <p style={{ fontSize: 16, margin: "0 0 12px" }} aria-live="polite">
        {parts.join(", ")}
      </p>
      <div style={{ borderTop: "2px solid var(--ink)" }}>
        {shows.map((show) => {
          const current = stageOf(show);
          return (
            <div key={show} style={{ borderBottom: "1px solid var(--rule)", padding: "14px 0", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 20px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, flex: "1 1 200px", minWidth: 0 }}>{show}</div>
              <div role="group" aria-label={`Stage for ${show}`} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {STAGES.map((s) => {
                  const on = s === current;
                  const bad = s === "declined" || s === "no_reply";
                  const color = bad ? "var(--orange)" : "var(--green)";
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={on}
                      onClick={() => choose(show, s)}
                      style={{
                        font: "inherit",
                        fontSize: 14,
                        padding: "6px 11px",
                        borderRadius: 999,
                        border: `1px solid ${on ? color : "var(--rule)"}`,
                        background: on ? color : "transparent",
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
                <div role="alert" style={{ flexBasis: "100%", fontSize: 15 }}>
                  Couldn’t save, try again
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 22 }}>
        <button className="copy" onClick={() => void next()} disabled={running} style={{ marginTop: 0, fontSize: 17, padding: "13px 22px" }}>
          {running ? "The agent is working…" : "Take the next move"}
        </button>
        <p className="muted" style={{ fontSize: 15, marginTop: 10, maxWidth: 680 }}>
          {waiting
            ? "Mark what happened above, then let the agent act: a no gets the next best set, silence gets a follow up, a reply gets an answer, shipped product gets a watch plan."
            : "Mark each show as you hear back. A no, silence, a reply or a shipment gives the agent its next move."}
        </p>
        {failed && (
          <p role="alert" style={{ color: "var(--orange)", fontWeight: 600 }}>
            {failed}
          </p>
        )}
        {moves && (
          <ul style={{ margin: "14px 0 0", paddingLeft: 20 }}>
            {moves.length ? moves.map((m) => <li key={m.show + m.kind} style={{ padding: "4px 0" }}>{m.summary}</li>) : <li>Nothing new to act on yet.</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
