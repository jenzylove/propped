// Plans and pitch boards in Vercel Blob. Every save is a new file under the plan's folder, never an overwrite,
// because public blobs are cached by the CDN after an overwrite. Reads ask the Blob API for the newest file,
// which is always fresh, then fetch that file, whose content never changes.
import "server-only";
import { head, list, put } from "@vercel/blob";
import { cleanBoard, type Board } from "./board";
import type { Plan } from "./plan";

async function newest(prefix: string) {
  try {
    const { blobs } = await list({ prefix, limit: 1000 });
    return blobs.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchJson<T>(url: string | null | undefined): Promise<T | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

const save = (path: string, data: unknown) =>
  put(path, JSON.stringify(data), { access: "public", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true });

export async function readPlan(id: string): Promise<Plan | null> {
  const v = await newest(`plans/${id}/`);
  if (v) return fetchJson<Plan>(v.url);
  const first = await head(`plans/${id}.json`).catch(() => null);
  return fetchJson<Plan>(first ? `${first.url}?t=${Date.now()}` : null);
}

/** The first save goes to plans/<id>.json; every later version gets its own file. */
export const savePlan = (plan: Plan, first = false) => save(first ? `plans/${plan.id}.json` : `plans/${plan.id}/${Date.now()}.json`, plan);

export async function readBoard(id: string): Promise<Board> {
  const v = await newest(`boards/${id}/`);
  if (v) return cleanBoard(await fetchJson(v.url));
  const old = await head(`boards/${id}.json`).catch(() => null);
  return cleanBoard(await fetchJson(old ? `${old.url}?t=${Date.now()}` : null));
}

export const saveBoard = (id: string, board: Board) => save(`boards/${id}/${Date.now()}.json`, board);
