/**
 * Classify a CJ product into Men / Women / Kids using signals in the product
 * name, falling back to the keyword's category.
 */

const KID_WORDS = /\b(kid|kids|child|children|toddler|baby|infant|boys?|girls?|junior|youth)\b/i;
// NOTE: "heel" used to be in this list, which misfiled ANY product mentioning
// a heel as Women — including "Men High Heel Boots". A heel is a shoe TYPE, not
// a gender: it belongs in the SUBcategory rules (where it already is), not here.
const WOMEN_WORDS = /\b(women|woman|women's|womens|ladies|lady|female|girl)\b/i;
const MEN_WORDS = /\b(men|man|men's|mens|male|gentleman)\b/i;
const SPORT_WORDS = /\b(football|soccer|cleats?|basketball|hiking|trekking|hik(e|ing))\b/i;

// ---- Gender-neutral distribution (2004 no-signal products were all defaulting
// to Men). When a name carries NO gender/kid word, we infer audience from the
// shoe TYPE, then split the truly-neutral remainder 50/50 Men/Women.

// Strongly-gendered TYPES: these are women's footwear regardless of any missing
// gender word. (Men's heels/stilettos effectively don't exist in this catalog;
// the rare "Men ... heel" case is caught by the explicit MEN_WORDS test, which
// runs BEFORE this in classifyCategory.)
const WOMEN_TYPE_WORDS =
  /\b(heels?|pumps?|stilettos?|wedges?|ballet\s?flats?|ballerinas?|espadrilles?|mary\s?janes?|kitten\s?heels?)\b/i;

// Light KID heuristics beyond explicit kid-words: sizing/marketing hints that
// reliably indicate children's footwear. Kept deliberately conservative to
// avoid stealing adult products. (User opted in to light Kids routing.)
const KID_HINT_WORDS =
  /\b(infant|newborn|crib\s?shoes?|first\s?walkers?|prewalkers?|light[\s-]?up|cartoon|paw\s?patrol|unicorn|dinosaur\s?shoes?|velcro\s?kids?|size\s?(1[0-3]|[1-9])c\b|eu\s?(1[0-9]|2[0-7])\b)/i;

// Neutral TYPES eligible for the 50/50 split. Anything that is genuinely unisex
// in real life: sneakers, running, casual, boots, sandals, slippers. (Per user:
// split sneakers/running/casual AND boots/sandals/slippers across Women too.)
const NEUTRAL_SPLIT_TYPE_WORDS =
  /\b(sneakers?|trainers?|running|jogging|casual|canvas|walking|boots?|sandals?|slippers?|flip[\s-]?flops?|slides?|mules?|loafers?|moccasins?)\b/i;

/**
 * Stable FNV-1a hash → deterministic 0/1 bucket from a product id.
 * Same id ALWAYS lands in the same bucket, so a product never flips category
 * between hourly refreshes (which would break detail pages & related products).
 * Falls back to hashing the name if no id is supplied.
 */
function stableBucket(seed = "") {
  const s = String(seed || "");
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % 2; // 0 → Men, 1 → Women (50/50)
}

export function classifyCategory(name = "", fallback = "", id = "") {
  const n = String(name).toLowerCase();

  // 1. Explicit fallback / Sports gate (kept: Sports is a top-level category).
  if (fallback === "Sports") return "Sports";
  if (SPORT_WORDS.test(n)) return "Sports";

  // 2. Explicit KID words win outright.
  if (KID_WORDS.test(n)) return "Kids";

  // 3. Explicit gender words win outright (before any type inference, so a real
  //    "Men Heeled Boots" stays Men and "Women Sneakers" stays Women).
  if (WOMEN_WORDS.test(n)) return "Women";
  if (MEN_WORDS.test(n)) return "Men";

  // 4. NO explicit gender word below this line — infer from TYPE.

  // 4a. Strongly-gendered women's type → Women.
  if (WOMEN_TYPE_WORDS.test(n)) return "Women";

  // 4b. Light kid hints → Kids.
  if (KID_HINT_WORDS.test(n)) return "Kids";

  // 4c. Neutral unisex type → deterministic 50/50 Men/Women split by id.
  if (NEUTRAL_SPLIT_TYPE_WORDS.test(n)) {
    return stableBucket(id || name) === 0 ? "Men" : "Women";
  }

  // 5. Explicit fallback category, else Men (last resort, e.g. no type match).
  if (["Men", "Women", "Kids", "Sports"].includes(fallback)) return fallback;
  return fallback || "Men";
}

const SUBCATEGORY_RULES = {
  // ★ ROOT CAUSE OF THE EMPTY CATEGORIES ★
  // These regexes were SINGULAR-only (/\bloafer\b/), but CJ product names are
  // almost always PLURAL ("Men Leather Loafers", "Ankle Boots", "Beach Sandals").
  // \bloafer\b does not match "loafers", so the rule scored 0 and the product
  // fell through to Casual — which is why Loafers/Boots/Sandals looked empty and
  // everything appeared "mixed". Every pattern now accepts the plural.
  Flats: [
    { regex: /\bflats?\b/i, weight: 10 },
    { regex: /\bballet\s?flats?\b/i, weight: 15 },
  ],
  Heels: [
    { regex: /\bheels?\b/i, weight: 3 },
    { regex: /\bpumps?\b/i, weight: 2 },
    { regex: /\bstilettos?\b/i, weight: 8 },
    { regex: /\bplatform\s?heels?\b/i, weight: 12 },
    { regex: /\bblock\s?heels?\b/i, weight: 12 },
  ],
  Boots: [
    { regex: /\bboots?\b/i, weight: 12 },
    { regex: /\bchelsea\b/i, weight: 15 },
    { regex: /\bankle\s?boots?\b/i, weight: 15 },
  ],
  Sandals: [
    { regex: /\bsandals?\b/i, weight: 12 },
    { regex: /\bgladiators?\b/i, weight: 15 },
  ],
  Loafers: [
    { regex: /\bloafers?\b/i, weight: 12 },
    { regex: /\bmoccasins?\b/i, weight: 15 },
  ],
  Sneakers: [
    { regex: /\bsneakers?\b/i, weight: 12 },
    { regex: /\btrainers?\b/i, weight: 10 },
  ],
  Slippers: [
    { regex: /\bslippers?\b/i, weight: 12 },
    { regex: /\bflip[\s-]?flops?\b/i, weight: 15 },
    { regex: /\bslides?\b/i, weight: 10 },
    { regex: /\bmules?\b/i, weight: 10 },
  ],
  Running: [
    { regex: /\brunning\b/i, weight: 15 },
    { regex: /\bjogging\b/i, weight: 12 },
  ],
  Sports: [
    { regex: /\bsports?\b/i, weight: 10 },
    { regex: /\bathletic\b/i, weight: 10 },
    { regex: /\b(training|gym|fitness)\b/i, weight: 10 },
  ],
  Football: [
    { regex: /\bfootball\b/i, weight: 20 },
    { regex: /\bsoccer\b/i, weight: 20 },
    { regex: /\bcleats?\b/i, weight: 20 },
  ],
  Basketball: [{ regex: /\bbasketball\b/i, weight: 20 }],
  Hiking: [{ regex: /\bhiking\b/i, weight: 20 }],
  "School Shoes": [
    { regex: /\bschool\b/i, weight: 20 },
    { regex: /\buniform\b/i, weight: 20 },
  ],
  Formal: [
    { regex: /\bformal\b/i, weight: 10 },
    { regex: /\b(oxfords?|brogues?|derby|dress\s?shoes?|business)\b/i, weight: 10 },
  ],
  Casual: [
    { regex: /\bcasual\b/i, weight: 5 },
    { regex: /\b(canvas|walking|comfort)\b/i, weight: 3 },
  ],
};

export function classifySubcategory(name = "", fallback = "", category = "") {
  const n = String(name).toLowerCase();

  // ===== Special cases =====
  if (/\bflat sandals?\b/i.test(n)) return "Sandals";
  if (/\bflat boots?\b/i.test(n)) return "Boots";
  if (/\bfootball shoes?\b/i.test(n)) return "Football";
  if (/\bbasketball shoes?\b/i.test(n)) return "Basketball";
  if (/\btrail running\b/i.test(n)) return "Running";

  if (
    category === "Men" &&
    /\bleather\b/i.test(n) &&
    // ★ The exclusions MUST allow plurals. `\bloafer\b` does not match
    //   "loafers", so "Men Leather Loafers" escaped this check and was forced
    //   to Formal — which is why the Loafers category was empty. Same for
    //   boot/boots, sneaker/sneakers. Also excluded: heels, flats, moccasins.
    !/\b(boots?|loafers?|moccasins?|sneakers?|trainers?|running|jogging|sports?|athletic|sandals?|slippers?|flip[\s-]?flops?|slides?|cleats?|heels?|flats?|oxfords?|brogues?)\b/i.test(n)
  ) {
    return "Formal";
  }

  // ===== Weighted scoring =====
  const scores = {};
  for (const subcategory of Object.keys(SUBCATEGORY_RULES)) {
    scores[subcategory] = 0;
    for (const rule of SUBCATEGORY_RULES[subcategory]) {
      if (rule.regex.test(n)) scores[subcategory] += rule.weight;
    }
  }

  let best = null;
  let bestScore = 0;
  for (const [subcategory, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = subcategory;
      bestScore = score;
    }
  }

  return best || fallback || "Casual";
}

/* ==================== FOOTWEAR GUARD ==================== */
const FOOTWEAR_WORDS =
  /\b(shoes?|sneakers?|trainers?|boots?|sandals?|slippers?|loafers?|heels?|flats?|pumps?|espadrilles?|moccasins?|oxfords?|brogues?|derby|clogs?|mules?|wedges?|stilettos?|flip[\s-]?flops?|slides?|cleats?|footwear)\b/i;

const NOT_FOOTWEAR_WORDS = new RegExp(
  [
    String.raw`\bshoe\w*\s+(\w+\s+)*?(rack|box|tree|horn|brush|bag|care|kit|polish|cleaner|cleaning|deodorizer|organizer|storage|stretcher|dryer)\b`,
    String.raw`\b(insoles?|inserts?|shoelaces?|laces?|shoe\s?pads?)\b`,
    String.raw`\b(socks?|stockings?|tights?|leggings?)\b`,
    String.raw`\b(bags?|backpacks?|handbags?|purses?|wallets?|luggage|suitcases?)\b`,
    String.raw`\b(belts?|hats?|caps?|gloves?|scarves?|masks?)\b`,
    String.raw`\b(jerseys?|shirts?|t-shirts?|pants?|trousers?|shorts?|jackets?|hoodies?|coats?|sweaters?|dress(es)?|skirts?|uniforms?)\b`,
    String.raw`\b(watch(es)?|sunglasses|glasses|jewelry|necklaces?|bracelets?|earrings?|rings?|keychains?)\b`,
    String.raw`\b(phone\s?case|charger|cable|earbuds?|headphones?)\b`,
    String.raw`\b(toys?|stickers?|posters?|mats?|cushions?)\b`,
  ].join("|"),
  "i"
);

export function isFootwear(name = "") {
  const n = String(name);
  if (!n.trim()) return false;
  if (NOT_FOOTWEAR_WORDS.test(n)) return false;
  if (FOOTWEAR_WORDS.test(n)) return true;
  if (
    /\b(high[\s-]?top|low[\s-]?top|lace[\s-]?up|slip[\s-]?on|velcro|platform|wedge|sole|insole\b(?!s)|walking|running|athletic)\b/i.test(n)
  ) {
    return true;
  }
  return false;
}