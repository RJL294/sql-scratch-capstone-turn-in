// Canonical category definitions. Drives the nav, section pages, and the
// default look (gradient + glyph) of any article that doesn't override it.
// `name`   – display name used in the nav and on section pages
// `kicker` – short label shown above headlines (defaults to name)
// `glyph`  – emoji used as the placeholder art for the category
// `gradient` – two-stop background used behind the glyph

export const CATEGORIES = [
  { slug: "kindness",        name: "Kindness",        kicker: "Kindness",     glyph: "💛", gradient: ["#FF5A36", "#FFC02E"] },
  { slug: "animals",         name: "Animals",         kicker: "Animals",      glyph: "🐾", gradient: ["#0C7C8C", "#1E9E63"] },
  { slug: "everyday-heroes", name: "Everyday Heroes", kicker: "Heroes",       glyph: "🚒", gradient: ["#FF5A36", "#F2A20C"] },
  { slug: "science-wins",    name: "Science Wins",    kicker: "Science Wins", glyph: "🔬", gradient: ["#1E9E63", "#7CB518"] },
  { slug: "good-ai",         name: "Good AI",         kicker: "Good AI",      glyph: "🤖", gradient: ["#2B6CB0", "#7A4BC9"] },
  { slug: "the-planet",      name: "The Planet",      kicker: "The Planet",   glyph: "🌍", gradient: ["#1E9E63", "#0C7C8C"] },
  { slug: "community",       name: "Community",       kicker: "Community",    glyph: "🤝", gradient: ["#F2A20C", "#FF5A36"] },
  { slug: "comebacks",       name: "Comebacks",       kicker: "Comebacks",    glyph: "🏅", gradient: ["#7A4BC9", "#FF5A36"] },
  { slug: "reunions",        name: "Reunions",        kicker: "Reunions",     glyph: "🫂", gradient: ["#FF5A36", "#FFC02E"] },
];

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));
const BY_NAME = new Map(CATEGORIES.map((c) => [c.name.toLowerCase(), c]));

const FALLBACK = { slug: "good-news", name: "Good News", kicker: "Good News", glyph: "☀", gradient: ["#FFC02E", "#FF5A36"] };

// Accepts a slug ("good-ai"), a display name ("Good AI"), or anything close.
export function resolveCategory(value) {
  if (!value) return FALLBACK;
  const key = String(value).trim().toLowerCase();
  return BY_SLUG.get(key) || BY_NAME.get(key) || FALLBACK;
}

export function categoryBySlug(slug) {
  return BY_SLUG.get(slug) || FALLBACK;
}
