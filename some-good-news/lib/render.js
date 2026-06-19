// HTML rendering helpers. Every function returns a string and reproduces the
// markup from the original mockup, just driven by data instead of hard-coded.

import { escapeHtml, gradientCss, relativeTime } from "./util.js";
import { CATEGORIES } from "./categories.js";

const SITE_NAME = "Some Good News";

// ---- tiny partials --------------------------------------------------------

function photo(article, { lead = false } = {}) {
  const cls = lead ? "photo" : "photo";
  return `<div class="${cls}" style="background:${gradientCss(article.gradient)};"><span class="glyph" aria-hidden="true">${article.glyph}</span></div>`;
}

function kicker(article) {
  return `<span class="kicker">${escapeHtml(article.kicker)}</span>`;
}

function byline(article, { now, full = false } = {}) {
  const short = !full;
  const time = relativeTime(article.publishedAt, now, short);
  const bits = [`via <b>${escapeHtml(article.source)}</b>`, escapeHtml(time)];
  if (full && article.readingTime) bits.push(escapeHtml(article.readingTime));
  return `<p class="byline">${bits.join(" · ")}</p>`;
}

function link(article, text) {
  const href = article.url ? escapeHtml(article.url) : "#";
  const ext = href !== "#" ? ' target="_blank" rel="noopener"' : "";
  return `<a href="${href}"${ext}>${escapeHtml(text)}</a>`;
}

// ---- cards ----------------------------------------------------------------

export function card(article, { now, size = "", withDek = false } = {}) {
  const cls = `card${size === "lg" ? " lg" : ""}`;
  const dek = withDek && article.dek ? `\n          <p class="dek">${escapeHtml(article.dek)}</p>` : "";
  return `<article class="${cls}">
          ${photo(article)}
          ${kicker(article)}
          <h3>${link(article, article.title)}</h3>${dek}
          ${byline(article, { now })}
        </article>`;
}

function railStory(article, { now, withPic = false } = {}) {
  if (withPic) {
    return `<div class="railstory withpic">
          ${photo(article)}
          <div>
            ${kicker(article)}
            <h3>${link(article, article.title)}</h3>
            ${byline(article, { now })}
          </div>
        </div>`;
  }
  return `<div class="railstory">
          ${kicker(article)}
          <h3>${link(article, article.title)}</h3>
          ${byline(article, { now })}
        </div>`;
}

// ---- larger building blocks ----------------------------------------------

export function splash(lead, rail, { now } = {}) {
  const railHtml = rail
    .map((a, i) => railStory(a, { now, withPic: i === 0 }))
    .join("\n\n        ");
  return `  <div class="wrap">
    <div class="splash">
      <div class="lead">
        ${photo(lead, { lead: true })}
        ${kicker(lead)}
        <h1>${link(lead, lead.title)}</h1>
        ${lead.dek ? `<p class="dek">${escapeHtml(lead.dek)}</p>` : ""}
        ${byline(lead, { now, full: true })}
      </div>

      <div class="rail">
        <div class="railhead">More good news <span>☀</span></div>

        ${railHtml}
      </div>
    </div>
  </div>`;
}

export function ticker(items) {
  const li = items
    .map((t) => `<span class="item">${escapeHtml(t)}</span>`)
    .join("\n            ");
  return `  <div class="ticker">
    <div class="wrap" style="padding:0;max-width:none;">
      <div class="row">
        <div class="label">Trending Smiles</div>
        <div class="track">
          <div class="move" id="ticker">
            ${li}
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

export function sectionBlock({ title, href, articles, layout = "grid3", size = "", withDek = false, now }) {
  if (!articles.length) return "";
  const cards = articles.map((a) => card(a, { now, size, withDek })).join("\n        ");
  const more = href ? `<a href="${escapeHtml(href)}" class="more">See all →</a>` : "";
  return `  <section class="block">
    <div class="wrap">
      <div class="sechead">
        <h2>${escapeHtml(title)}</h2>
        ${more}
      </div>
      <div class="${layout}">
        ${cards}
      </div>
    </div>
  </section>`;
}

export function meter(stats) {
  const cells = stats
    .map((s) => {
      const value = s.suffix
        ? `<div class="num" data-suffix="${escapeHtml(s.suffix)}">${escapeHtml(s.suffix)}</div>`
        : `<div class="num" data-count="${s.value}">0</div>`;
      return `<div class="stat">${value}<div class="lbl">${escapeHtml(s.label)}</div></div>`;
    })
    .join("\n        ");
  return `  <div class="meter">
    <div class="wrap">
      <p class="eyebrow">The Good News Meter · this week</p>
      <h2>Proof it's <em>not all bad</em> out there.</h2>
      <div class="stats">
        ${cells}
      </div>
    </div>
  </div>`;
}

// ---- chrome (shared across every page) ------------------------------------

function utilBar() {
  return `  <div class="util">
    <div class="wrap">
      <span class="date" id="today">&nbsp;</span>
      <span class="tag">Good news only</span>
      <span class="spacer"></span>
      <span class="live"><span class="dot"></span>Updated <span class="mono" id="clock">—</span></span>
      <a href="#tip" class="sub">Get the daily smile →</a>
    </div>
  </div>`;
}

function nav(activeSlug) {
  const links = CATEGORIES.map((c) => {
    const active = c.slug === activeSlug ? ' class="active" aria-current="page"' : "";
    return `          <a href="${c.slug}.html"${active}>${escapeHtml(c.name)}</a>`;
  }).join("\n");
  return `      <nav>
        <div class="navrow">
${links}
        </div>
      </nav>`;
}

function masthead(activeSlug) {
  return `  <header class="masthead">
    <div class="wrap">
      <div class="nameplate">
        <a href="index.html" aria-label="${SITE_NAME} home" style="display:flex;align-items:center;gap:18px;">
        <svg class="sun" width="64" height="64" viewBox="0 0 100 100" aria-hidden="true">
          <g fill="none" stroke="#FFC02E" stroke-width="6" stroke-linecap="round" class="ray">
            <line x1="50" y1="6" x2="50" y2="20"/>
            <line x1="82" y1="18" x2="72" y2="28"/>
            <line x1="94" y1="50" x2="80" y2="50"/>
            <line x1="18" y1="18" x2="28" y2="28"/>
            <line x1="6"  y1="50" x2="20" y2="50"/>
            <line x1="71" y1="71" x2="80" y2="80"/>
            <line x1="29" y1="71" x2="20" y2="80"/>
          </g>
          <circle cx="50" cy="50" r="20" fill="#FFC02E"/>
          <circle cx="50" cy="50" r="20" fill="none" stroke="#1B1613" stroke-width="3"/>
        </svg>
        <h1 class="wordmark">Some <span class="good">Good</span> News</h1>
        </a>
      </div>
      <p class="dateline">
        Good news only, since 2026 <span class="pip"></span> <b>Hand-picked from across the web</b> <span class="pip"></span> Verified before it cheers you up
      </p>
${nav(activeSlug)}
    </div>
  </header>`;
}

function footer() {
  return `  <footer>
    <div class="wrap">
      <div class="foot-top">
        <div class="how">
          <h4>How Some Good News works</h4>
          <p>We comb publishers across the web for the stories that make your day a little brighter, show you the headline and a quick summary, then send you straight to the <a href="#">original source</a> for the full story. We don't republish anyone's work — good news belongs to everyone, and credit belongs to the people who reported it.</p>
        </div>
        <div class="tip" id="tip">
          <h4>Spotted something good?</h4>
          <p>A neighbor, a rescue, a small win on your street — if it made you smile, send it our way.</p>
          <a href="#" class="btn">Send us a tip →</a>
        </div>
      </div>
      <div class="legal">
        <span class="wm">Some <em>Good</em> News</span>
        <span class="spacer"></span>
        <span>© 2026 · Good news only</span>
        <span>About</span>
        <span>Sources</span>
        <span>Newsletter</span>
      </div>
    </div>
  </footer>`;
}

export function page({ title, description, body, activeSlug = "" }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description || "")}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Newsreader:ital,opsz,wght@0,16..72,400;0,16..72,500;1,16..72,400&family=Spline+Sans+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/styles.css">
</head>
<body>

${utilBar()}

${masthead(activeSlug)}

${body}

${footer()}

<script src="assets/main.js"></script>
</body>
</html>
`;
}
