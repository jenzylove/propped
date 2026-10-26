/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Finder from "@/components/Finder";
import { Reveal } from "@/components/Reveal";
import { SAMPLE } from "./chrome";
import { PlacementDrops, type PlanData } from "./plan/PlanView";
import showcase from "@/data/showcase.json";
import sample from "@/data/sample-plan.json";

type Snap = { name: string; poster: string | null; status: string | null; network: string | null; specific: boolean; match: string | null };
const brands = showcase.brands as Record<string, { brand: string; shows: Snap[] }>;
const hero = brands["Liquid Death"].shows.filter((s) => s.poster).slice(0, 5);
const plan = sample as unknown as PlanData;

const RANGEME = "https://www.rangeme.com/blog/how-to-get-product-placement-in-movies-and-tv/";

const SWAP: [string, string][] = [
  ["Guess from your own taste", "The shows your customers actually watch"],
  ["Pitch shows your customers don’t watch", "Shows ranked for your brand, not everyone’s"],
  ["Pitch shows that stopped filming years ago", "Only shows still filming get a pitch"],
  ["Months of cold emails", "A letter, a studio and what to send, in a minute"],
];

const STEPS = [
  {
    t: "Type your brand",
    s: "Qloo finds it",
    d: "Propped looks your brand up in Qloo, which knows what people who love one thing also love: brands, shows, music, food.",
  },
  {
    t: "See the shows your customers watch",
    s: "Twelve shows, ranked for you",
    d: "The shows your customers watch far more than everyone else. Shows every brand gets are pushed down. Each one shows if it is still filming, its network and how close its audience is to yours.",
  },
  {
    t: "Get a placement pack",
    s: "A pitch letter per set",
    d: "The agent picks the shows still filming, says what to send, and writes a letter to each show’s set decoration and props team.",
  },
  {
    t: "Reach the same viewers with ads",
    s: "From about $100",
    d: "A self serve TV ad plan for the same genres, networks and audience, on Universal Ads or Amazon Sponsored TV.",
  },
];

const FAQ = [
  {
    q: "Does product placement really cost nothing?",
    a: "Most of it, yes. Sets need real products, and crews take them from brands for free. Paid deals exist, but they are the exception. Propped writes the free kind of pitch.",
  },
  {
    q: "Does Propped contact the shows for me?",
    a: "No. You get the pitch letters, who makes each show and what to send. You send them yourself, so every message comes from you.",
  },
  {
    q: "Where does the data come from?",
    a: "Which shows your customers watch, and the age and gender lean of each audience, come from Qloo. Show status, network and posters come from TVmaze. The production company comes from Wikipedia.",
  },
  {
    q: "Can I buy ads on one exact show?",
    a: "Not on self serve platforms. They sell genres, networks and audiences. Propped uses your shows to pick the genres and networks, and says so plainly.",
  },
  {
    q: "What if my brand isn’t found?",
    a: "You get a clear message, never a guess. Try a brand your customers also buy, and you will see who they are.",
  },
  {
    q: "Does it use personal data?",
    a: "No. Qloo works on anonymous taste patterns across millions of people. Propped never sees or stores a person.",
  },
];

const fit = (m: string | null) => (m === "the same people" ? "Same audience" : m === "close" ? "Close audience" : "Made for you");

function Drops({ items, first = true }: { items: { t: string; s?: string; d: string }[]; first?: boolean }) {
  return (
    <div className="drops">
      {items.map((x, i) => (
        <details key={x.t} className="drop" open={first && i === 0}>
          <summary>
            <span className="drop-n">{String(i + 1).padStart(2, "0")}</span>
            <span>
              <span className="drop-t">{x.t}</span>
              {x.s && <span className="drop-s">{x.s}</span>}
            </span>
          </summary>
          <div className="drop-body">
            <p className="muted">{x.d}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

export default function Landing() {
  const common = showcase.common.slice(0, 6);
  const four = ["Liquid Death", "Parachute", "Athletic Brewing", "Olipop"].map((b) => brands[b]);
  return (
    <main>
      <Reveal />

      {/* hero */}
      <section className="wrap hero">
        <div className="hero-copy">
          <p className="tape">A Qloo taste agent</p>
          <h1 className="display hero-h">
            Get your product on the shows your <em>customers</em> watch.
          </h1>
          <p className="muted hero-sub">
            Type your brand. Propped shows the TV your customers watch more than anyone else, then writes the pitch that gets your product on set.
          </p>
          <div className="cta-row">
            <Link className="btn big" href="/app">
              Find my shows
            </Link>
            <Link className="btn ghost big" href={SAMPLE}>
              See a sample plan
            </Link>
          </div>
        </div>
        <div className="fan" aria-label="Shows Liquid Death customers watch">
          {hero.map((s, i) => (
            <figure key={s.name} className="fan-card" style={{ ["--i" as string]: i - 2 }}>
              <img src={s.poster!} alt={`${s.name} poster`} />
            </figure>
          ))}
          <div className="fan-note">
            <span className="tape">Liquid Death customers watch</span>
            {hero.slice(0, 3).map((s) => (
              <div key={s.name} className="fan-row">
                <b>{s.name}</b>
                <span>{fit(s.match)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* figures */}
      <section className="wrap figs rv">
        <div>
          <strong>95%</strong>
          <span>
            of product placements in film and TV involve no money, says{" "}
            <a href={RANGEME} target="_blank" rel="noopener noreferrer">RangeMe</a>
          </span>
        </div>
        <div>
          <strong>12</strong>
          <span>shows your customers watch, ranked for your brand</span>
        </div>
        <div>
          <strong>$100</strong>
          <span>
            to start a self serve TV campaign for the same viewers.{" "}
            <a href="https://www.universalads.com/article/advertise-on-tv-without-a-big-budget" target="_blank" rel="noopener noreferrer">Universal Ads</a>
          </span>
        </div>
      </section>

      {/* 01 problem */}
      <section id="problem" className="wrap chapter rv">
        <p className="tape">Sc. 01 · The problem</p>
        <h2 className="display chap-h">
          Sets need real products. <em>Nobody tells you which sets.</em>
        </h2>
        <p className="lede">
          Every kitchen, bar fridge and bedside table on TV is dressed by a props team, and most of what they use comes free from brands. The hard
          part for a small brand is knowing which shows its own customers watch. That answer lives in audience research a founder can’t buy.
        </p>
        <ul className="swap">
          {SWAP.map(([a, b]) => (
            <li key={a}>
              <s>{a}</s>
              <i aria-hidden="true">→</i>
              <b>{b}</b>
            </li>
          ))}
        </ul>
      </section>

      {/* 02 how */}
      <section id="how" className="wrap chapter rv">
        <p className="tape">Sc. 02 · How it works</p>
        <h2 className="display chap-h">
          From a brand name to a plan, <em>in under a minute.</em>
        </h2>
        <Drops items={STEPS} />
        <Link className="textlink" href="/method">
          Every step in detail ↗
        </Link>
      </section>

      {/* 03 try */}
      <section id="try" className="wrap chapter rv">
        <p className="tape">Sc. 03 · Try it here</p>
        <h2 className="display chap-h">
          Type any brand. <em>Real data, right now.</em>
        </h2>
        <div className="demo">
          <Finder embed initial="Liquid Death" />
        </div>
      </section>

      {/* 04 what you get */}
      <section id="pack" className="wrap chapter rv">
        <p className="tape">Sc. 04 · What you get</p>
        <h2 className="display chap-h">
          A pitch for every set. <em>An ad plan for the rest.</em>
        </h2>
        <p className="lede">A real plan the agent wrote for {plan.brand}, a bedding brand. Open a show to read its letter.</p>
        <PlacementDrops placements={plan.placements} ads={plan.ads} />
        <Link className="textlink" href={SAMPLE}>
          Open the full {plan.brand} plan ↗
        </Link>
      </section>

      {/* 05 qloo */}
      <section id="qloo" className="wrap chapter rv">
        <p className="tape">Sc. 05 · Built on Qloo</p>
        <h2 className="display chap-h">
          Your list, <em>not everyone’s.</em>
        </h2>
        <p className="lede">
          Qloo knows which shows the people who love your brand watch. Some shows turn up for many brands, so Propped pushes those down and lifts the
          ones that belong to you.
        </p>
        <div className="common">
          <span className="kicker">Shows many brands get, pushed down</span>
          <div style={{ marginTop: 10 }}>
            {common.map((c) => (
              <span key={c.name} className="chip struck">
                {c.name} <b>{c.brands} of {showcase.total} brands</b>
              </span>
            ))}
          </div>
        </div>
        <div className="lists">
          {four.map((b) => {
            const top = b.shows.filter((s) => s.poster).slice(0, 3);
            return (
              <div key={b.brand} className="list">
                <span className="kicker">{b.brand}</span>
                <div className="list-posters">
                  {top.map((s) => (
                    <img key={s.name} src={s.poster!} alt={`${s.name} poster`} title={s.name} loading="lazy" />
                  ))}
                </div>
                <p className="faint" style={{ fontSize: 13, margin: "8px 0 0" }}>
                  {top.map((s) => s.name).join(", ")}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 06 faq */}
      <section id="faq" className="wrap chapter rv">
        <p className="tape">Sc. 06 · Fair questions</p>
        <h2 className="display chap-h">Before you send a thing.</h2>
        <Drops items={FAQ.map((f) => ({ t: f.q, d: f.a }))} first={false} />
      </section>

      {/* closing */}
      <section className="wrap rv">
        <div className="ender">
          <h2 className="display">
            Your customers are already watching. <em>Be on the set.</em>
          </h2>
          <div className="cta-row" style={{ justifyContent: "center" }}>
            <Link className="btn big" href="/app">
              Find my shows
            </Link>
            <Link className="btn ghost big" href={SAMPLE}>
              See a sample plan
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
