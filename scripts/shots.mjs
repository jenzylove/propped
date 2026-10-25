// node scripts/shots.mjs <baseUrl> <path> <name>  -> full page light/dark desktop + mobile light
import { chromium } from "playwright";
const [base, path, name] = process.argv.slice(2);
const browser = await chromium.launch();
for (const [label, opts] of [
  ["desktop-light", { viewport: { width: 1360, height: 900 }, colorScheme: "light" }],
  ["desktop-dark", { viewport: { width: 1360, height: 900 }, colorScheme: "dark" }],
  ["mobile-light", { viewport: { width: 390, height: 844 }, colorScheme: "light", deviceScaleFactor: 2 }],
]) {
  const page = await browser.newPage(opts);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(base + path, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(2500);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  await page.screenshot({ path: `../qloo-launch/shots/${name}-${label}.png`, fullPage: true });
  console.log(label, "errors:", errors.slice(0, 3), "horizontal overflow:", overflow);
  await page.close();
}
await browser.close();
