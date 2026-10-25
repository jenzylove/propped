import type { Metadata } from "next";
import reference from "../../../data/reference.json";
import { PLATFORMS } from "@/lib/plan";

export const metadata: Metadata = { title: "How it works · Propped" };

const refInfo = reference as { builtAt: string; brands: unknown[] };
const built = new Date(refInfo.builtAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="row2 rule" style={{ padding: "28px 0" }}>
      <div>
        <div className="kicker">Step {n}</div>
        <h2 className="display" style={{ fontSize: "clamp(24px, 3vw, 34px)", marginTop: 6 }}>{title}</h2>
      </div>
      <div style={{ maxWidth: 680 }}>{children}</div>
    </section>
  );
}

const p = { margin: "0 0 12px" } as const;

export default function MethodPage() {
  return (
    <main className="wrap" style={{ paddingTop: 56, paddingBottom: 40 }}>
      <div className="kicker">How it works</div>
      <h1 className="display" style={{ fontSize: "clamp(36px, 6vw, 68px)", marginTop: 12, maxWidth: 900 }}>
        From a brand name to a plan for getting on screen
      </h1>
      <p className="muted" style={{ fontSize: 20, maxWidth: 720, marginTop: 14 }}>
        Every step uses real data. The model writes the words. It never makes up the facts.
      </p>

      <div style={{ marginTop: 40 }}>
        <Step n={1} title="Find your brand in Qloo">
          <p style={p}>We search Qloo for your brand and match the name strictly. The name we get back has to look like the name you typed.</p>
          <p style={p}>So “Rhode” won’t match “Rhode Island School of Design”. If your brand isn’t in Qloo, you get a clear message, not a guess.</p>
        </Step>
        <Step n={2} title="Read the shows your customers love">
          <p style={p}>Qloo knows what people who love a brand also love. We ask for the top 50 TV shows your customers watch more than other people do.</p>
        </Step>
        <Step n={3} title="Rank the shows for your brand">
          <p style={p}>Raw lists are full of shows that every food or lifestyle brand gets. So we score each show as its affinity times a specificity weight.</p>
          <p style={p}>The weight is high when few other brands share the show, and low when many do. Shows many brands share are pushed down. Shows that belong to you rise.</p>
          <p style={p}>
            We measured the shared shows against a reference set of {refInfo.brands.length} brands, built on {built}.
          </p>
        </Step>
        <Step n={4} title="Check the audience match">
          <p style={p}>Qloo gives an age and gender lean for your brand and for each show. We compare the two.</p>
          <p style={p}><b>The same people:</b> the show’s viewers look a lot like your customers.</p>
          <p style={p}><b>Close:</b> they overlap in some age groups or in gender lean.</p>
          <p style={p}><b>Different:</b> the show draws a broader or different crowd than yours.</p>
        </Step>
        <Step n={5} title="Get the show facts">
          <p style={p}>TVmaze gives us each show’s status, network, genres, poster and type. Wikipedia gives us the production company, who you would write to.</p>
        </Step>
        <Step n={6} title="Build the plan">
          <p style={p}>Product placement is only for shows that are running or waiting on a renewal, and only live action. Animated shows are left out.</p>
          <p style={p}>Ads are bought by genre, network and audience, because self serve platforms don’t sell single shows. Your shows are the reason we pick those genres and networks.</p>
          <div className="kicker" style={{ marginTop: 20 }}>Where to buy</div>
          {PLATFORMS.map((pl) => (
            <div key={pl.name} style={{ padding: "10px 0" }}>
              <a href={pl.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, fontSize: 18 }}>{pl.name}</a>
              <p className="muted" style={{ margin: "4px 0 0" }}>{pl.how}</p>
            </div>
          ))}
        </Step>
        <Step n={7} title="What Propped doesn’t do">
          <p style={p}>It uses no personal data. It never contacts anyone for you. It doesn’t buy ads on single shows. And a brand missing from Qloo gets a message, not a guess.</p>
        </Step>
      </div>
    </main>
  );
}
