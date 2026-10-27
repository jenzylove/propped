import { chromium } from "playwright";
const OUT = "C:/Users/LENOVO/propped-launch/gallery";
const B = "https://propped-alpha.vercel.app";
const b = await chromium.launch();
const page = () => b.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1.25 });
const go = (p, u) => p.goto(u.startsWith("file") ? u : B + u, { waitUntil: "load", timeout: 90000 });
const toHeading = (p, re, off = 120) =>
  p.evaluate(([src, o]) => {
    const h = [...document.querySelectorAll("h2")].find((x) => new RegExp(src, "i").test(x.textContent));
    scrollTo(0, h.getBoundingClientRect().top + scrollY - o);
  }, [re, off]);
const shot = (p, name) => p.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 88 });

// 1. The hook slide from the video: hundreds of shows, only yours stay lit.
let p = await page();
await go(p, "file:///C:/Users/LENOVO/propped-launch/video4/slides.html?p1#p1");
await p.waitForFunction(() => document.fonts.status === "loaded" && [...document.images].every((i) => i.complete));
await p.evaluate(() => { window.DIM_AT = 2600; window.play(); });
await p.waitForTimeout(4600);
await shot(p, "1-which-sets-are-yours");

// 2. Landing hero.
p = await page();
await go(p, "/");
await p.waitForFunction(() => document.fonts.status === "loaded" && [...document.querySelectorAll(".fan img")].every((i) => i.complete));
await p.waitForTimeout(2500);
await shot(p, "2-landing");

// 3. The shows a brand's customers watch.
p = await page();
await go(p, "/app?brand=Parachute");
await p.waitForFunction(() => document.querySelectorAll(".wall .tile").length >= 8, null, { timeout: 90000 });
await toHeading(p, "customers watch");
await p.waitForFunction(() => [...document.querySelectorAll(".wall .tile img")].slice(0, 5).every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 30000 });
await p.waitForTimeout(1500);
await shot(p, "3-your-customers-shows");

// 4 to 6. The sample plan: TV this week, the sets to pitch, the agent's next moves.
p = await page();
await go(p, "/plan/parachute-fs150");
await p.waitForTimeout(2500);
await toHeading(p, "on tv this week", 160);
await p.waitForTimeout(800);
await shot(p, "4-on-tv-this-week");
await toHeading(p, "pitch these sets", 160);
await p.waitForTimeout(800);
await shot(p, "5-sets-that-will-say-yes");
await toHeading(p, "track it", 130);
await p.waitForTimeout(800);
await shot(p, "6-agent-keeps-going");

// 7. Under the hood slide.
p = await page();
await go(p, "file:///C:/Users/LENOVO/propped-launch/video4/slides.html?w1#w1");
await p.waitForFunction(() => document.fonts.status === "loaded");
await p.evaluate(() => { window.ROW_AT = [100, 200, 300, 400, 500]; window.play(); });
await p.waitForTimeout(2500);
await shot(p, "7-under-the-hood");
await b.close();
