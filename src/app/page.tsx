/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Finder from "@/components/Finder";
import { Reveal } from "@/components/Reveal";
import { SAMPLE } from "./chrome";
import showcase from "@/data/showcase.json";
import sample from "@/data/sample-plan.json";

type Snap = { name: string; poster: string | null; status: string | null; network: string | null; specific: boolean; match: string | null };
const brands = showcase.brands as Record<string, { brand: string; shows: Snap[] }>;
const hero = brands["Liquid Death"].shows.filter((s) => s.poster).slice(0, 5);
const plan = sample as {
  brand: string;
  summary: string;
  placements: { show: string; network: string | null; status: string; company: string | null; poster: string | null; why: string; send: string; pitch: string }[];
  ads: { genres: string[]; networks: string[]; audience: { ages: string[]; gender: string } };
};

const RANGEME = "https://www.rangeme.com/blog/how-to-get-product-placement-in-movies-and-tv/";

const STEPS = [
  {
    t: "Type your brand",
    d: "Propped finds it in Qloo, which knows what people who love one thing also love: brands, shows, music, food.",
  },
  {
    t: "See the shows your customers watch",
    d: "Twelve shows your customers watch far more than everyone else, ranked for your brand, with live status, network and how close each audience is to yours.",
  },
  {
    t: "Get a placement pack",
    d: "The agent picks the shows still filming, says what to send, and writes a pitch letter to each one’s set decoration and props team.",
  },
  {
    t: "Reach the same viewers with ads",
    d: "A self serve TV ad plan for the same genres, networks and audience, on platforms that start at about $100.",
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

const fit = (m: string | null) => (m === "the same people" ? "Same audience as yours" : m === "close" ? "Close to your audience" : null);

export default function Landing() {
  const common = showcase.common.slice(0, 6);
  const four = ["Liquid Death", "Parachute", "Athletic Brewing", "Olipop"].map((b) => brands[b]);
  return (
    <main>
      <Reveal />

      {/* hero */}
      <section className="wrap hero">
        <div className="hero-copy">
          <span className="pill glass" style={{ fontSize: 13 }}>
            <span className="dot live" /> Built on Qloo taste data
          </span>
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
          <div className="glass fan-note">
            <span className="kicker">Liquid Death customers watch</span>
            {hero.slice(0, 3).map((s) => (
              <div key={s.name} className="fan-row">
                <b>{s.name}</b>
                <span className="v-fits" style={{ fontSize: 13, fontWeight: 600 }}>{fit(s.match) ?? "Made for you"}</span>
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
            of TV product placements involve no money.{" "}
            <a href={RANGEME} target="_blank" rel="noopener noreferrer">RangeMe</a>
          </span>
        </div>
        <div>
          <strong>12</strong>
          <span>shows your customers watch, ranked for your brand</span>
        </div>
        <div>
          <strong>$100</strong>
          <span>to start a self serve TV campaign for the same viewers</span>
        </div>
      </section>

      {/* 01 problem */}
      <section id="problem" className="wrap chapter rv">
        <span className="num">01</span>
        <div>
          <p className="kicker">The problem</p>
          <h2 className="display chap-h">
            Sets need real products. <em>Nobody tells you which sets.</em>
          </h2>
          <p className="lede">
            Every kitchen, bar fridge and bedside table on TV is dressed by a props team, and most of what they use comes free from brands. The
            hard part for a small brand is knowing which shows its own customers watch. That answer lives in audience research a founder can’t
            buy, so they guess, cold email for months, or pay an agency.
          </p>
          <div className="versus">
            <div className="glass">
              <span className="kicker" style={{ color: "var(--orange)" }}>Today</span>
              <ul>
                <li>Guess from your own taste</li>
                <li>Pitch shows your customers don’t watch</li>
                <li>Pitch shows that stopped filming years ago</li>
              </ul>
            </div>
            <div className="glass" style={{ background: "var(--green-soft)" }}>
              <span className="kicker" style={{ color: "var(--green)" }}>With Propped</span>
              <ul>
                <li>The shows your customers actually watch</li>
                <li>Only shows still filming get a pitch</li>
                <li>A letter, a studio and what to send for each</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 02 how */}
      <section id="how" className="wrap chapter rv">
        <span className="num">02</span>
        <div>
          <p className="kicker">How it works</p>
          <h2 className="display chap-h">
            From a brand name to a plan, <em>in under a minute.</em>
          </h2>
          <ol className="how">
            {STEPS.map((s, i) => (
              <li key={s.t}>
                <span className="how-n">{i + 1}</span>
                <h3>{s.t}</h3>
                <p className="muted">{s.d}</p>
              </li>
            ))}
          </ol>
          <Link className="textlink" href="/method">
            Every step in detail ↗
          </Link>
        </div>
      </section>

      {/* 03 try */}
      <section id="try" className="wrap chapter rv">
        <span className="num">03</span>
        <div style={{ minWidth: 0 }}>
          <p className="kicker">Try it here</p>
          <h2 className="display chap-h">
            Type any brand. <em>Real data, right now.</em>
          </h2>
          <div className="glass console">
            <Finder embed initial="Liquid Death" />
          </div>
        </div>
      </section>

      {/* 04 what you get */}
      <section id="pack" className="wrap chapter rv">
        <span className="num">04</span>
        <div style={{ minWidth: 0 }}>
          <p className="kicker">What you get</p>
          <h2 className="display chap-h">
            A pitch for every set. <em>An ad plan for the rest.</em>
          </h2>
          <p className="lede">This is a real plan the agent wrote for {plan.brand}, a bedding brand.</p>
          <div className="packs">
            {plan.placements.slice(0, 2).map((p) => (
              <article key={p.show} className="glass pack">
                <div className="pack-head">
                  {p.poster && <img src={p.poster} alt={`${p.show} poster`} />}
                  <div>
                    <h3>{p.show}</h3>
                    <div style={{ marginTop: 6 }}>
                      {p.network && <span className="chip">{p.network}</span>}
                      <span className="chip v-fits">
                        <b>{p.status === "running" ? "Running" : "Awaiting renewal"}</b>
                      </span>
                    </div>
                    {p.company && <p className="faint" style={{ fontSize: 13, margin: "4px 0 0" }}>Made by {p.company}</p>}
                  </div>
                </div>
                <p className="kicker" style={{ marginTop: 16 }}>What to send</p>
                <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{p.send}</p>
                <p className="kicker" style={{ marginTop: 14 }}>Pitch letter</p>
                <p className="letter">{p.pitch}</p>
              </article>
            ))}
          </div>
          <div className="glass adbar">
            <div>
              <span className="kicker">Ad plan</span>
              <p style={{ margin: "6px 0 0", fontWeight: 600 }}>Same viewers, on Universal Ads or Amazon streaming TV ads</p>
            </div>
            <div>
              {plan.ads.genres.map((g) => (
                <span key={g} className="chip">{g}</span>
              ))}
              {plan.ads.networks.map((n) => (
                <span key={n} className="chip">{n}</span>
              ))}
              {plan.ads.audience.ages.map((a) => (
                <span key={a} className="chip">{a}</span>
              ))}
              <span className="chip">{plan.ads.audience.gender}</span>
            </div>
          </div>
          <Link className="textlink" href={SAMPLE}>
            Open the full {plan.brand} plan ↗
          </Link>
        </div>
      </section>

      {/* 05 qloo */}
      <section id="qloo" className="wrap chapter rv">
        <span className="num">05</span>
        <div style={{ minWidth: 0 }}>
          <p className="kicker">Built on Qloo</p>
          <h2 className="display chap-h">
            Your list, <em>not everyone’s.</em>
          </h2>
          <p className="lede">
            Qloo knows which shows the people who love your brand watch. Some shows turn up for almost every brand, so Propped pushes those down
            and lifts the ones that belong to you.
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
            {four.map((b) => (
              <div key={b.brand} className="list">
                <span className="kicker">{b.brand}</span>
                <div className="list-posters">
                  {b.shows
                    .filter((s) => s.poster)
                    .slice(0, 3)
                    .map((s) => (
                      <img key={s.name} src={s.poster!} alt={`${s.name} poster`} title={s.name} loading="lazy" />
                    ))}
                </div>
                <p className="faint" style={{ fontSize: 13, margin: "8px 0 0" }}>
                  {b.shows
                    .filter((s) => s.poster)
                    .slice(0, 3)
                    .map((s) => s.name)
                    .join(", ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 06 faq */}
      <section id="faq" className="wrap chapter rv">
        <span className="num">06</span>
        <div>
          <p className="kicker">Fair questions</p>
          <h2 className="display chap-h">Before you send a thing.</h2>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p className="muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* closing */}
      <section className="wrap rv">
        <div className="ender glass">
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
