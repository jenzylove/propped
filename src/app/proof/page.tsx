import type { Metadata } from "next";
import proof from "@/data/proof.json";

export const metadata: Metadata = { title: "Proof · Propped" };

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
const h2 = { fontSize: "clamp(28px, 4vw, 44px)" } as const;

export default function ProofPage() {
  const { refusal, distinct, rows, model, ranAt } = proof;
  const pairsPct = (n: number) => `${n} of ${distinct.raw.pairs}`;
  return (
    <main className="wrap" style={{ paddingTop: 56, paddingBottom: 40 }}>
      <div className="kicker">Proof</div>
      <h1 className="display" style={{ fontSize: "clamp(36px, 6vw, 68px)", marginTop: 12, maxWidth: 900 }}>
        An AI alone can’t answer this. Qloo can.
      </h1>

      <section style={{ marginTop: 56 }}>
        <div className="display" style={{ fontSize: "clamp(72px, 14vw, 168px)", color: "var(--orange)" }}>
          {refusal.refused} of {refusal.total}
        </div>
        <p style={{ fontSize: 22, maxWidth: 720, marginTop: 8, fontWeight: 600 }}>
          brands where the model alone refused to name the shows their customers watch
        </p>
        <p className="muted" style={{ marginTop: 10 }}>
          Model: {model}. Run on {day(ranAt)}.
        </p>
        <div className="kicker" style={{ marginTop: 28 }}>The question we asked</div>
        <blockquote style={{ margin: "8px 0 0", paddingLeft: 16, borderLeft: "3px solid var(--rule)", maxWidth: 720, fontSize: 19 }}>
          “List the 10 TV shows whose viewers disproportionately love the brand [brand], compared with the general population. Plain comma separated list, nothing else.”
        </blockquote>
      </section>

      <section style={{ marginTop: 64 }}>
        <h2 className="display" style={h2}>Every brand we asked about</h2>
        <div style={{ marginTop: 24 }}>
          {rows.map((r) => (
            <div key={r.brand} className="rule" style={{ display: "flex", gap: 16, padding: "10px 0", alignItems: "baseline", flexWrap: "wrap" }}>
              <b style={{ flex: "1 1 160px", minWidth: 0 }}>{r.brand}</b>
              <span className={r.refused ? "v-missing" : "v-fits"} style={{ fontWeight: 700, flex: "0 0 90px" }}>
                {r.refused ? "Refused" : "Answered"}
              </span>
              {!r.refused && (
                <span className="muted" style={{ fontSize: 13, flex: "1 1 100%", overflowWrap: "anywhere" }}>
                  {r.answer}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 72 }}>
        <h2 className="display" style={h2}>Lists are specific to each brand</h2>
        <p className="muted" style={{ marginTop: 10, maxWidth: 720 }}>
          We compared the top {distinct.top} shows for every pair of the {proof.brands} brands, {distinct.raw.pairs} pairs in all.
        </p>
        <div className="split" style={{ marginTop: 28 }}>
          <div>
            <div className="kicker">Raw top {distinct.top}</div>
            <div className="display" style={{ fontSize: "clamp(56px, 9vw, 104px)" }}>{pct(distinct.raw.mean)}</div>
            <p className="muted">mean overlap. {pairsPct(distinct.raw.pairsAboveHalf)} pairs share more than half their shows.</p>
          </div>
          <div>
            <div className="kicker">Ranked for each brand</div>
            <div className="display" style={{ fontSize: "clamp(56px, 9vw, 104px)", color: "var(--green)" }}>{pct(distinct.ranked.mean)}</div>
            <p className="muted">mean overlap. {pairsPct(distinct.ranked.pairsAboveHalf)} pairs share more than half their shows.</p>
          </div>
        </div>
        <p style={{ marginTop: 24, maxWidth: 720, fontSize: 19 }}>
          Shows every food brand gets are pushed down, so each list fits its own brand.
        </p>
      </section>

      <section style={{ marginTop: 72 }}>
        <h2 className="display" style={h2}>What we can’t prove</h2>
        <p style={{ marginTop: 14, maxWidth: 720, fontSize: 19 }}>
          The best outside answer key would be real TV ad airing data, which shows where brands actually advertise. That data is paid (iSpot), so we don’t claim more than this.
        </p>
      </section>

      <section style={{ marginTop: 72 }}>
        <h2 className="display" style={h2}>Run it yourself</h2>
        <pre className="mono glass" style={{ marginTop: 14, padding: 16, fontSize: 13, overflowX: "auto", boxShadow: "none" }}>
          node --env-file=.env --conditions=react-server --import tsx scripts/proof.mts
        </pre>
      </section>
    </main>
  );
}
