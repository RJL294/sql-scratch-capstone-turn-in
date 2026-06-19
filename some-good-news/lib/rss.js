// A tolerant, dependency-free RSS 2.0 / Atom parser. It only needs to pull a
// handful of fields per entry (title, link, summary, date, id), so a forgiving
// regex pass beats pulling in a full XML library — and keeps the project
// installable with zero `npm install`.

function decodeEntities(str = "") {
  return String(str)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#x2019;/gi, "’")
    .replace(/&amp;/g, "&")
    .trim();
}

function tag(block, name) {
  // Matches <name ...>value</name>, allowing namespaces (e.g. dc:date).
  const re = new RegExp(`<(?:[a-z0-9]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z0-9]+:)?${name}>`, "i");
  const m = re.exec(block);
  return m ? decodeEntities(m[1]) : "";
}

// Atom links live in attributes: <link rel="alternate" href="..."/>
function atomLink(block) {
  const links = [...block.matchAll(/<link\b([^>]*)\/?>/gi)];
  let fallback = "";
  for (const [, attrs] of links) {
    const href = /href\s*=\s*"([^"]+)"/i.exec(attrs);
    if (!href) continue;
    const rel = /rel\s*=\s*"([^"]+)"/i.exec(attrs);
    if (!rel || /alternate/i.test(rel[1])) return decodeEntities(href[1]);
    if (!fallback) fallback = decodeEntities(href[1]);
  }
  return fallback;
}

function blocks(xml, name) {
  const re = new RegExp(`<${name}\\b[\\s\\S]*?</${name}>`, "gi");
  return xml.match(re) || [];
}

export function parseFeed(xml) {
  const items = [];
  const rssItems = blocks(xml, "item");
  const atomEntries = blocks(xml, "entry");
  const raw = rssItems.length ? rssItems : atomEntries;

  for (const block of raw) {
    const title = tag(block, "title");
    if (!title) continue;
    const link = tag(block, "link") || atomLink(block);
    const summary =
      tag(block, "description") ||
      tag(block, "summary") ||
      tag(block, "encoded") || // content:encoded
      tag(block, "content");
    const dateStr =
      tag(block, "pubDate") ||
      tag(block, "published") ||
      tag(block, "updated") ||
      tag(block, "date");
    const id = tag(block, "guid") || tag(block, "id") || link;

    items.push({
      title,
      link: link.trim(),
      summary,
      date: dateStr ? new Date(dateStr) : null,
      id: id || link,
    });
  }
  return items;
}
