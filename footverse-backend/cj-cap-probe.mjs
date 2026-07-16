/**
 * READ-ONLY probe (v2) — verbose + defensive. Confirms CJ's per-category
 * totalRecords cap and reports real catalog size. Frugal (~15-18 requests).
 */
import "dotenv/config";
import CJ_CONFIG from "./src/config/cjConfig.js";
import { apiClient, getLastPointsInfo } from "./src/utils/apiClient.js";
import { FOOTWEAR_CATEGORY_SEED } from "./src/data/footwearCategories.js";

let requests = 0;
async function cjGet(ep) { requests++; return apiClient.get(ep); }
const points = () => { const p = getLastPointsInfo(); return p?.remaining ?? "?"; };

function readMeta(raw, size) {
  const d = raw;
  let list = [], total = null, tp = null;
  if (Array.isArray(d)) { list = d[0]?.list || []; total = d[0]?.total ?? null; }
  else if (d?.content) { list = d.content[0]?.productList || []; total = d.totalRecords ?? null; tp = d.totalPages ?? null; }
  else if (d?.productList) { list = d.productList; total = d.totalRecords ?? null; tp = d.totalPages ?? null; }
  if (tp == null && total != null && size > 0) tp = Math.ceil(total / size);
  return { count: list.length, total, totalPages: tp };
}

(async () => {
  console.log("=== CJ probe v2 (verbose) ===\n");

  // 1. getCategory — dump the RAW shape so we can see what CJ actually returns.
  console.log("→ getCategory…");
  let tree;
  try {
    tree = await cjGet(CJ_CONFIG.CATEGORY.LIST);
  } catch (e) {
    console.log("✗ getCategory threw:", e.message);
    process.exit(1);
  }
  console.log("✓ getCategory returned. Type:", Array.isArray(tree) ? "array" : typeof tree);
  console.log("  top-level keys/len:", Array.isArray(tree) ? `array[${tree.length}]` : Object.keys(tree || {}).join(","));
  // Show the shape of the first node so we can fix the walker if needed.
  const firstNode = Array.isArray(tree) ? tree[0] : (tree?.content || tree?.list || tree);
  console.log("  first node keys:", firstNode ? Object.keys(firstNode).join(", ") : "(none)");
  console.log("  first node sample:", JSON.stringify(firstNode)?.slice(0, 400));

  // 2. Recursively collect ALL leaves with a categoryId, regardless of key names.
  const leaves = [];
  function walk(node, path) {
    if (!node) return;
    if (Array.isArray(node)) { for (const n of node) walk(n, path); return; }
    const id = node.categoryId || node.id;
    const name = node.categoryName || node.name || node.categoryFirstName || node.categorySecondName || "";
    const childKeys = Object.keys(node).filter((k) => Array.isArray(node[k]));
    if (id && name && childKeys.length === 0) { leaves.push({ categoryId: id, name, path: [...path, name].join(" / ") }); return; }
    for (const k of childKeys) walk(node[k], name ? [...path, name] : path);
    if (id && name && childKeys.length === 0) leaves.push({ categoryId: id, name, path: [...path, name].join(" / ") });
  }
  walk(tree, []);
  console.log(`\nTotal leaf categories with an id: ${leaves.length}`);

  const FOOT = /\b(shoes?|sneakers?|boots?|sandals?|slippers?|loafers?|heels?|flats?|footwear|espadrilles?|clogs?|mules?|pumps?|vulcanize|moccasins?|oxfords?|brogues?|derby|trainers?|cleats?)\b/i;
  const EXCL = /\b(bag|luggage|wallet|backpack|crossbody|briefcase|handbag|purse|tote|clutch|sock|insole|lace|polish|care|rack|clothing|apparel|coat|jacket|shirt|pants|dress|hat|glove|watch|jewel)\b/i;
  const footwear = leaves.filter((l) => FOOT.test(l.path) && !EXCL.test(l.name));
  console.log(`Footwear leaf categories: ${footwear.length}\n`);
  footwear.slice(0, 50).forEach((c) => console.log(`   ${c.path}  [${c.categoryId}]`));

  // 3. Probe totalRecords: seed + up to 6 discovered.
  const toProbe = [
    ...FOOTWEAR_CATEGORY_SEED.map((c) => ({ categoryId: c.categoryId, path: `SEED ${c.name}` })),
    ...footwear.filter((d) => !FOOTWEAR_CATEGORY_SEED.some((s) => s.categoryId === d.categoryId)).slice(0, 6)
      .map((c) => ({ categoryId: c.categoryId, path: `DISC ${c.name}` })),
  ];
  console.log(`\n→ Probing ${toProbe.length} categories (page 1, size 200)…\n`);
  const totals = [];
  for (const c of toProbe) {
    try {
      const raw = await cjGet(`${CJ_CONFIG.PRODUCT.LIST_V2}?page=1&size=200&categoryId=${c.categoryId}&features=enable_category`);
      const m = readMeta(raw, 200);
      if (typeof m.total === "number") totals.push(m.total);
      console.log(`   ${String(m.total ?? "?").padStart(6)} records · ${String(m.totalPages ?? "?").padStart(3)} pages · ${String(m.count).padStart(3)} on pg1 · ${c.path}`);
    } catch (e) {
      console.log(`   ERROR ${c.path}: ${e.message}`);
    }
  }

  const allK = totals.length && totals.every((t) => t === 1000);
  const mx = Math.max(...totals, 0), sum = totals.reduce((a, b) => a + b, 0);
  console.log("\n===== VERDICT =====");
  console.log(`totalRecords: min=${Math.min(...totals, 0)} max=${mx} sum=${sum} across ${totals.length} cats`);
  console.log(allK ? "⚠ 1000-CAP CONFIRMED (every category = exactly 1000)"
    : mx > 1000 ? "✓ NO hard 1000 cap (some exceed 1000)"
    : "~ categories under 1000 (breadth is the lever, not depth)");
  console.log(`footwear categories available: ${footwear.length}`);
  console.log(`requests spent: ${requests} · points: ${points()}`);
})();
