// Pulls every feed listed in feeds.json, normalizes the entries, and writes them
// to data/feed-cache.json. The build step reads that cache, so fetching and
// building are decoupled: the site builds deterministically (and offline) from
// whatever was last fetched.
//
// Usage: npm run fetch  [-- --limit=12]

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFeed } from "../lib/rss.js";
import { truncate } from "../lib/util.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : fallback;
}

const PER_FEED_LIMIT = Number(arg("limit", 12));
const TIMEOUT_MS = Number(arg("timeout", 15000));

async function fetchText(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "SomeGoodNews/1.0 (+https://example.com)", Accept: "application/rss+xml, application/atom+xml, text/xml, */*" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const cfg = JSON.parse(await readFile(path.join(ROOT, "feeds.json"), "utf8"));
  const feeds = cfg.feeds || [];
  const items = [];
  let ok = 0;

  for (const feed of feeds) {
    process.stdout.write(`• ${feed.source || feed.url} … `);
    try {
      const xml = await fetchText(feed.url);
      const parsed = parseFeed(xml).slice(0, PER_FEED_LIMIT);
      for (const p of parsed) {
        if (!p.link) continue;
        items.push({
          title: p.title,
          dek: truncate(p.summary, 220),
          url: p.link,
          source: feed.source || new URL(feed.url).hostname.replace(/^www\./, ""),
          category: feed.category || "good-news",
          publishedAt: p.date && !isNaN(p.date) ? p.date.toISOString() : new Date().toISOString(),
          origin: "feed",
        });
      }
      ok++;
      console.log(`${parsed.length} items`);
    } catch (err) {
      console.log(`skipped (${err.message})`);
    }
  }

  const out = { fetchedAt: new Date().toISOString(), count: items.length, items };
  await writeFile(path.join(DATA, "feed-cache.json"), JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${items.length} items from ${ok}/${feeds.length} feeds → data/feed-cache.json`);
  if (ok === 0) {
    console.log("No feeds reachable (offline or blocked). The site will still build from data/articles.json.");
  }
}

main().catch((err) => {
  console.error("fetch-feeds failed:", err);
  process.exit(1);
});
