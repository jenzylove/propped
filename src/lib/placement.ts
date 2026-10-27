// How realistic a free placement is, and who a pitch goes to. Pure rules over TVmaze and Wikipedia facts.

export type Tier = "likely" | "pitch" | "adbuy";
export interface Chance {
  tier: Tier;
  label: string;
  why: string;
}

const UNSCRIPTED = /reality|documentary|game show|talk show|variety|news|sports|award/i;
// Broadcast networks and the biggest streamers: scripted shows here rarely take an unknown brand without an ad buy.
const BIG = new Set(["abc", "nbc", "cbs", "fox", "the cw", "apple tv", "apple tv+", "netflix", "hbo", "max", "hbo max", "prime video", "amazon prime video", "disney+", "hulu", "paramount+", "peacock", "bbc one", "itv1"]);

// Public broadcasters that take no product placement in their own shows.
const NO_PLACEMENT = /^(bbc|pbs\b|cbc gem|abc iview|abc tv|sbs on demand)/i;
export const allowsPlacement = (network: string | null) => !network || !NO_PLACEMENT.test(network.trim());

const DAY = 86_400_000;
/** TVmaze leaves streaming shows "running" for years. A show counts as filming only if a new episode is
 *  scheduled or one aired in the last 18 months. */
export function filmingNow(i: { status: string; nextEpisode: string | null; lastAired: string | null }, now = Date.now()) {
  if (i.status === "ended") return false;
  if (i.nextEpisode) return true;
  return !!i.lastAired && now - Date.parse(`${i.lastAired}T00:00:00Z`) <= 548 * DAY;
}

export function chanceOf(kind: string | null, network: string | null): Chance {
  if (kind && UNSCRIPTED.test(kind)) {
    return { tier: "likely", label: "Likely yes", why: "Unscripted shows dress real homes, kitchens and kit, and often take free product from brands." };
  }
  if (network && BIG.has(network.trim().toLowerCase())) {
    return { tier: "adbuy", label: "Needs an ad buy", why: "A big scripted show. These rarely take an unknown brand unless an ad buy comes with it." };
  }
  return { tier: "pitch", label: "Worth a pitch", why: "A smaller scripted show. Free product with a good fit gets a real look." };
}

export const TIER_ORDER: Record<Tier, number> = { likely: 0, pitch: 1, adbuy: 2 };

/** One number per set, out of 100: how strongly Qloo ties the show to the brand (40), how close its
 *  audience is to the brand's customers (30), and how realistic a free placement is (30). */
export function fitScore(rank: number, total: number, audience: string | null, tier: Tier) {
  const taste = 40 * (1 - (Math.max(1, rank) - 1) / Math.max(1, total));
  const crowd = audience === "the same people" ? 30 : audience === "close" ? 21 : audience === "different" ? 9 : 15;
  const odds = tier === "likely" ? 30 : tier === "pitch" ? 18 : 6;
  return Math.round(taste + crowd + odds);
}

export interface Recipient {
  /** Who the letter opens with, e.g. "Dear Cabot McMullen and the set decoration team". */
  greeting: string;
  /** Where it goes, in one plain line. */
  line: string;
  person: string | null;
  role: string | null;
  company: string | null;
}

export function recipientOf(show: string, crew: { name: string; role: string }[], company: string | null, network: string | null): Recipient {
  const lead = crew[0] ?? null;
  company = company ? company.split(",")[0].trim() : null;
  const the = (name: string) => (/^the\s/i.test(name) ? name : `the ${name}`);
  const office = company ? `${company} production office` : network ? `${the(show)} production team at ${network}` : `${the(show)} production office`;
  if (lead) {
    return {
      greeting: `Dear ${lead.name} and the set decoration team`,
      line: `${lead.name}, ${lead.role}, and the set decoration team, care of ${company ? the(office) : office}`,
      person: lead.name,
      role: lead.role,
      company,
    };
  }
  return {
    greeting: "Dear set decoration team",
    line: `The set decoration team, care of ${company ? the(office) : office}`,
    person: null,
    role: null,
    company,
  };
}
