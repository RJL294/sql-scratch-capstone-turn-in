// Small, dependency-free helpers shared by the fetcher and the builder.

export function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function slugify(str = "") {
  return String(str)
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "story";
}

// Strip HTML tags and collapse whitespace (RSS summaries are full of markup).
export function stripHtml(str = "") {
  return String(str)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Trim a string to a whole-word limit, adding an ellipsis if cut.
export function truncate(str = "", max = 180) {
  const clean = stripHtml(str);
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

// Human "time ago". `short` gives the compact form used on cards (3h, 2d).
export function relativeTime(date, now = new Date(), short = false) {
  const then = date instanceof Date ? date : new Date(date);
  if (isNaN(then)) return "";
  const secs = Math.max(0, Math.round((now - then) / 1000));
  const mins = Math.round(secs / 60);
  const hours = Math.round(mins / 60);
  const days = Math.round(hours / 24);

  if (short) {
    if (mins < 60) return `${Math.max(1, mins)}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return `${Math.round(days / 7)}w`;
  }
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

// Rough reading time from a word count (used when an article omits it).
export function estimateReadingTime(text = "") {
  const words = stripHtml(text).split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

export function gradientCss(gradient) {
  const [a, b] = Array.isArray(gradient) ? gradient : ["#FFC02E", "#FF5A36"];
  return `linear-gradient(135deg,${a},${b})`;
}
