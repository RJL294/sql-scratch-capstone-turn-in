// Generates the static site into dist/ from the article data. No data lives in
// this file — it only decides layout. Run `npm run build`.

import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadArticles } from "../lib/articles.js";
import { CATEGORIES } from "../lib/categories.js";
import * as R from "../lib/render.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const DIST = path.join(ROOT, "dist");

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

// Pick `take` articles for a homepage section, skipping any already shown.
function pickForSection(section, articles, used) {
  let pool = articles;
  if (section.tag) pool = pool.filter((a) => a.tags.includes(section.tag));
  else if (section.category) pool = pool.filter((a) => a.category === section.category);
  const chosen = [];
  for (const a of pool) {
    if (used.has(a.id)) continue;
    chosen.push(a);
    used.add(a.id);
    if (chosen.length >= (section.take || 4)) break;
  }
  return chosen;
}

function buildHome(articles, home, now) {
  const used = new Set();

  const featured = articles.find((a) => a.featured) || articles[0];
  if (featured) used.add(featured.id);

  let rail = articles.filter((a) => a.rail && a.id !== featured?.id);
  if (rail.length < 3) {
    for (const a of articles) {
      if (rail.length >= 3) break;
      if (a.id === featured?.id || rail.includes(a)) continue;
      rail.push(a);
    }
  }
  rail = rail.slice(0, 3);
  rail.forEach((a) => used.add(a.id));

  const parts = [];
  if (featured) parts.push(R.splash(featured, rail, { now }));
  if (home.ticker?.length) parts.push(R.ticker(home.ticker));

  for (const section of home.sections || []) {
    const picks = pickForSection(section, articles, used);
    parts.push(
      R.sectionBlock({
        title: section.title,
        href: section.href,
        articles: picks,
        layout: section.layout || "grid3",
        size: section.size || "",
        withDek: Boolean(section.withDek),
        now,
      })
    );
  }

  if (home.meter?.length) parts.push(R.meter(home.meter));

  return R.page({
    title: "Some Good News — Good news only",
    description: "A daily roundup of feel-good news from across the web. Verified before it cheers you up.",
    body: parts.filter(Boolean).join("\n\n"),
    activeSlug: "",
  });
}

function buildSection(category, articles, now) {
  const inCat = articles.filter((a) => a.category === category.slug);
  const hero = `  <div class="wrap">
    <div class="pagehero">
      <span class="kicker">Some Good News</span>
      <h1>${category.name}</h1>
      <p>${inCat.length} feel-good ${inCat.length === 1 ? "story" : "stories"} in ${category.name} — every headline links straight to the original source.</p>
    </div>
  </div>`;

  let body;
  if (inCat.length) {
    const cards = inCat
      .map((a) => R.card(a, { now, withDek: Boolean(a.dek) }))
      .join("\n        ");
    body = `${hero}
  <section class="block">
    <div class="wrap">
      <div class="grid3">
        ${cards}
      </div>
    </div>
  </section>`;
  } else {
    body = `${hero}
  <section class="block">
    <div class="wrap">
      <p class="empty">No stories here just yet — check back soon. ☀</p>
    </div>
  </section>`;
  }

  return R.page({
    title: `${category.name} — Some Good News`,
    description: `Feel-good ${category.name} stories from across the web.`,
    body,
    activeSlug: category.slug,
  });
}

async function main() {
  const now = new Date();
  const articles = await loadArticles({ dataDir: DATA, now });
  const home = await readJson(path.join(DATA, "home.json"), { sections: [] });

  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await cp(path.join(ROOT, "assets"), path.join(DIST, "assets"), { recursive: true });

  // Homepage
  await writeFile(path.join(DIST, "index.html"), buildHome(articles, home, now));

  // One page per category
  for (const cat of CATEGORIES) {
    await writeFile(path.join(DIST, `${cat.slug}.html`), buildSection(cat, articles, now));
  }

  const byCat = {};
  for (const a of articles) byCat[a.category] = (byCat[a.category] || 0) + 1;
  console.log(`Built ${1 + CATEGORIES.length} pages from ${articles.length} articles → dist/`);
  console.log("  index.html");
  for (const cat of CATEGORIES) {
    console.log(`  ${cat.slug}.html  (${byCat[cat.slug] || 0})`);
  }
}

main().catch((err) => {
  console.error("build failed:", err);
  process.exit(1);
});
