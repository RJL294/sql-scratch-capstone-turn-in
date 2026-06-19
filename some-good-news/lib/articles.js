// Loads articles from every data source, normalizes them into one shape, then
// dedupes and sorts. The rest of the build only ever sees normalized articles,
// so curated entries and RSS-fetched entries are treated identically.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveCategory } from "./categories.js";
import { slugify, truncate, estimateReadingTime } from "./util.js";

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw new Error(`Could not parse ${file}: ${err.message}`);
  }
}

// Resolve a publish date from any of the supported fields. `hoursAgo` keeps the
// bundled sample data looking fresh no matter when the site is built.
function resolveDate(raw, now) {
  if (raw.publishedAt) {
    const d = new Date(raw.publishedAt);
    if (!isNaN(d)) return d;
  }
  if (raw.hoursAgo != null) return new Date(now.getTime() - Number(raw.hoursAgo) * 3600 * 1000);
  if (raw.date) {
    const d = new Date(raw.date);
    if (!isNaN(d)) return d;
  }
  return now;
}

function normalize(raw, now) {
  const cat = resolveCategory(raw.category);
  const title = String(raw.title || "").trim();
  const dek = raw.dek ? truncate(raw.dek, 220) : raw.summary ? truncate(raw.summary, 220) : "";
  const publishedAt = resolveDate(raw, now);

  return {
    id: raw.id || raw.url || raw.link || slugify(title),
    slug: raw.slug || slugify(title),
    title,
    dek,
    url: (raw.url || raw.link || "#").trim(),
    source: (raw.source || "Around the web").trim(),
    category: cat.slug,
    categoryName: cat.name,
    kicker: raw.kicker || cat.kicker,
    glyph: raw.glyph || cat.glyph,
    gradient: Array.isArray(raw.gradient) ? raw.gradient : cat.gradient,
    publishedAt,
    readingTime: raw.readingTime || (dek ? estimateReadingTime(dek) : ""),
    featured: Boolean(raw.featured),
    rail: Boolean(raw.rail),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  };
}

export async function loadArticles({ dataDir, now = new Date() } = {}) {
  const curated = await readJson(path.join(dataDir, "articles.json"), []);
  const fetched = await readJson(path.join(dataDir, "feed-cache.json"), { items: [] });
  const fetchedItems = Array.isArray(fetched) ? fetched : fetched.items || [];

  const all = [...curated, ...fetchedItems]
    .filter((r) => r && r.title)
    .map((r) => normalize(r, now));

  // Dedupe by URL first, then by slug, keeping the earliest (curated wins
  // because curated entries are processed first).
  const seen = new Set();
  const deduped = [];
  for (const a of all) {
    const key = a.url && a.url !== "#" ? a.url.toLowerCase() : `slug:${a.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(a);
  }

  deduped.sort((x, y) => y.publishedAt - x.publishedAt);
  return deduped;
}
