/**
 * Classify a CJ product into Men / Women / Kids using signals in the product
 * name, falling back to the keyword's category. Broad keyword searches (e.g.
 * "sneakers") return mixed products, so we detect the real audience from the
 * name so categories never get mixed.
 */

const KID_WORDS = /\b(kid|kids|child|children|toddler|baby|infant|boys?|girls?|junior|youth)\b/i;
const WOMEN_WORDS = /\b(women|woman|women's|womens|ladies|lady|female|girl|heel|heels)\b/i;
const MEN_WORDS = /\b(men|man|men's|mens|male|gentleman)\b/i;

/**
 * @param {string} name       product name/title
 * @param {string} fallback   category implied by the search keyword (Men/Women/Kids)
 * @returns {"Men"|"Women"|"Kids"} the resolved category
 */
export function classifyCategory(name = "", fallback = "") {
  const n = String(name).toLowerCase();

  // Kids takes priority — "kids women style sandal" is a kids product.
  if (KID_WORDS.test(n)) return "Kids";
  // "women" before "men" because "women" contains "men" as a substring; the
  // word-boundary regexes above already handle this, but order adds safety.
  if (WOMEN_WORDS.test(n)) return "Women";
  if (MEN_WORDS.test(n)) return "Men";

  // No clear signal in the name → trust the keyword's category.
  if (["Men", "Women", "Kids"].includes(fallback)) return fallback;
  return fallback || "Men";
}

/**
 * Resolve a subcategory from the name by matching known footwear types, falling
 * back to the keyword's subcategory.
 */
const SUB_PATTERNS = [
  [/\bsneaker/i, "Sneakers"],
  [/\b(running|runner)\b/i, "Running"],
  [/\b(sport|athletic|training|gym)\b/i, "Sports"],
  [/\bformal\b/i, "Formal"],
  [/\bloafer/i, "Loafers"],
  [/\bboot/i, "Boots"],
  [/\bsandal/i, "Sandals"],
  [/(slipper|flip[\s-]?flops?|slides?)/i, "Slippers"],
  [/\bheel/i, "Heels"],
  [/\bflat/i, "Flats"],
  [/\b(school|uniform)\b/i, "School Shoes"],
  [/\bcasual\b/i, "Casual"],
];

export function classifySubcategory(name = "", fallback = "") {
  const n = String(name);
  for (const [rx, sub] of SUB_PATTERNS) {
    if (rx.test(n)) return sub;
  }
  return fallback || "Casual";
}
