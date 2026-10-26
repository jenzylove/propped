// node scripts/shots-scroll.mjs <url> <name>: scrolls the page so reveals fire, then full page light, dark, mobile
import { chromium } from "playwright";
const [url, name] = process.argv.slice(2);
const b = await chromium.launch();
for (const [label, opts] of [
  ["desktop-light", { viewport: { width: 1360, height: 900 }, colorScheme: "light" }],
  ["mobile-light", { viewport: { width: 390, height: 844 }, colorScheme: "light", deviceScaleFactor: 2 }],
]) {
  const p = await b.newPage(opts);
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await p.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 500) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(120); }
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(1500);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  await p.screenshot({ path: `../qloo-launch/shots/${name}-${label}.png`, fullPage: true });
  console.log(label, "errors:", errors.slice(0, 3), "overflow:", overflow);
  await p.close();
}
await b.close();
