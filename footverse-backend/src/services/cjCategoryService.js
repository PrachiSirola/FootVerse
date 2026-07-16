import CJ_CONFIG from "../config/cjConfig.js";
import { apiClient } from "../utils/apiClient.js";
import { FOOTWEAR_CATEGORY_SEED } from "../data/footwearCategories.js";
import { getCJProductsV2 } from "./cjProductService.js";
import { isFootwear } from "../utils/categoryClassifier.js";

/**
 * CATEGORY DISCOVERY (v2)
 * Shape-agnostic walker + three-signal footwear detection (path / style / sports)
 * + optional page-1 content verification for ambiguous categories.
 */

const FOOTWEAR_STYLE =
  /\b(shoes?|sneakers?|trainers?|boots?|booties?|sandals?|slippers?|loafers?|heels?|flats?|pumps?|espadrilles?|moccasins?|oxfords?|brogues?|derby|derbies|chukkas?|wellingtons?|wellies|galoshes|chelsea|mary\s?janes?|ballerinas?|ballet|clogs?|mules?|wedges?|stilettos?|platforms?|flip[\s-]?flops?|slides?|cleats?|footwear|kicks?|plimsolls?|brogans?|huaraches?|slip[\s-]?ons?)\b/i;

const FOOTWEAR_BRANCH = /\b(shoes?|footwear)\b/i;

const SPORTS_SHOE = /\b(soccer|football|basketball|running|jogging|hiking|trekking|tennis|golf|skate|skateboard|volleyball|badminton|cycling|athletic|sport)\b/i;
const SPORTS_BRANCH = /\b(sport|athletic|outdoor|activewear|fitness)\b/i;

const EXCLUDE = /\b(bag|bags|luggage|wallet|wallets|backpack|backpacks|crossbody|briefcase|handbag|handbags|purse|purses|tote|totes|clutch|satchel|duffel|pouch|accessor|insoles?|inserts?|shoelaces?|laces?|polish|shoe\s?care|cleaner|rack|racks|shoe\s?tree|shoehorn|deodor|freshener|charm|charms|sock|socks|stocking|clothing|apparel|coat|jacket|shirt|pants|trouser|short|dress|skirt|hat|cap|glove|scarf|belt|watch|sunglass|jewel|necklace|bracelet|earring|ring|pet|dog|cat|puppy|paw)\b/i;

function walkTree(node, path, out) {
  if (!node) return;
  if (Array.isArray(node)) { for (const n of node) walkTree(n, path, out); return; }
  if (typeof node !== "object") return;
  const id = node.categoryId || node.id;
  const name =
    node.categoryName || node.name ||
    node.categoryFirstName || node.categorySecondName || node.categoryThirdName || "";
  const childKeys = Object.keys(node).filter((k) => Array.isArray(node[k]));
  if (childKeys.length === 0) {
    if (id && name) out.push({ categoryId: id, name, path: [...path, name].join(" / ") });
    return;
  }
  const nextPath = name ? [...path, name] : path;
  for (const k of childKeys) walkTree(node[k], nextPath, out);
}

function classifyLeaf(leaf) {
  const name = leaf.name || "";
  const path = leaf.path || name;
  if (EXCLUDE.test(name)) return "no";
  if (FOOTWEAR_BRANCH.test(path)) return "footwear";
  if (FOOTWEAR_STYLE.test(name)) return "footwear";
  if (SPORTS_SHOE.test(name) && SPORTS_BRANCH.test(path)) return "footwear";
  if (SPORTS_SHOE.test(name)) return "ambiguous";
  return "no";
}

function inferBucket(leaf) {
  const s = (leaf.path + " " + leaf.name).toLowerCase();
  let category = "";
  if (/\b(women|woman|ladies|female|girl)\b/.test(s)) category = "Women";
  else if (/\b(men|man|male|gentleman)\b/.test(s)) category = "Men";
  else if (/\b(kid|kids|child|children|toddler|baby|infant|junior|youth)\b/.test(s)) category = "Kids";
  else if (SPORTS_BRANCH.test(s) || SPORTS_SHOE.test(s)) category = "Sports";
  return { category, subcategory: "" };
}

async function verifyByContent(leaf) {
  try {
    const res = await getCJProductsV2({ categoryId: leaf.categoryId, size: 50, page: 1 });
    const items = res?.products || [];
    if (items.length === 0) return false;
    let foot = 0;
    for (const p of items) {
      const nm = p.nameEn || p.productNameEn || p.name || "";
      if (isFootwear(nm)) foot++;
    }
    const ratio = foot / items.length;
    console.log(`[cj category] verify "${leaf.name}": ${foot}/${items.length} footwear (${(ratio * 100) | 0}%) → ${ratio > 0.5 ? "KEEP" : "drop"}`);
    return ratio > 0.5;
  } catch (e) {
    console.warn(`[cj category] verify "${leaf.name}" failed: ${e.message} — dropping`);
    return false;
  }
}

export async function discoverFootwear({ verify = true } = {}) {
  let tree;
  try {
    tree = await apiClient.get(CJ_CONFIG.CATEGORY.LIST);
  } catch (err) {
    console.warn(`[cj category] getCategory failed (${err.message}) — seed only`);
    return { footwear: [], leaves: 0, definite: 0, ambiguous: 0, verified: 0 };
  }
  const leaves = [];
  walkTree(tree, [], leaves);
  const byId = new Map();
  for (const l of leaves) if (l.categoryId && !byId.has(l.categoryId)) byId.set(l.categoryId, l);
  const unique = [...byId.values()];

  const definite = [], ambiguous = [];
  for (const l of unique) {
    const c = classifyLeaf(l);
    if (c === "footwear") definite.push(l);
    else if (c === "ambiguous") ambiguous.push(l);
  }

  let verifiedKeep = [];
  if (verify && ambiguous.length) {
    console.log(`[cj category] verifying ${ambiguous.length} ambiguous categories by sampling…`);
    for (const l of ambiguous) if (await verifyByContent(l)) verifiedKeep.push(l);
  }

  const footwear = [...definite, ...verifiedKeep].map((l) => ({
    categoryId: l.categoryId, name: l.name, path: l.path, ...inferBucket(l),
  }));

  console.log(
    `[cj category] discovered — ${unique.length} leaves, ${definite.length} definite footwear, ` +
    `${ambiguous.length} ambiguous (${verifiedKeep.length} kept) → ${footwear.length} total`
  );
  return { footwear, leaves: unique.length, definite: definite.length, ambiguous: ambiguous.length, verified: verifiedKeep.length };
}

export async function buildFootwearCrawlList({ verify = true } = {}) {
  const { footwear } = await discoverFootwear({ verify });
  const byId = new Map();
  for (const d of footwear) byId.set(d.categoryId, d);
  for (const c of FOOTWEAR_CATEGORY_SEED) {
    byId.set(c.categoryId, { categoryId: c.categoryId, name: c.name, category: c.category, subcategory: c.subcategory });
  }
  const list = [...byId.values()];
  const seedCount = FOOTWEAR_CATEGORY_SEED.length;
  console.log(`[cj category] crawl list = ${list.length} categories (${seedCount} seed + ${list.length - seedCount} discovered)`);
  return list;
}