/**
 * READ-ONLY diagnostic. Does NOT touch the crawler, pool, Redis, or any state.
 * Compares category-ID crawling vs keyword crawling for unique-products-per-request.
 *
 * Reuses your existing apiClient (auth + QPS + points-awareness all handled).
 * Spends a SMALL, bounded number of CJ requests (default ~25) and prints a report.
 *
 * Run from the backend root:  node cj-category-measure.mjs
 */
import "dotenv/config";
import CJ_CONFIG from "./src/config/cjConfig.js";
import { apiClient, getLastPointsInfo } from "./src/utils/apiClient.js";
import categoryKeywords from "./src/data/categoryKeywords.js";

const SAMPLE_CATEGORIES = Number(process.env.MEASURE_CATEGORIES || 8); // footwear cats to sample
const SAMPLE_KEYWORDS   = Number(process.env.MEASURE_KEYWORDS || 8);   // keywords to sample
const DEEP_PAGES        = Number(process.env.MEASURE_DEEP_PAGES || 3); // pages to actually crawl per sample (for real dup measurement)
const PAGE_SIZE         = Number(process.env.MEASURE_PAGE_SIZE || 200);

// Footwear detection on CJ category NAMES (three-level tree).
const FOOTWEAR_CAT = /\b(shoes?|sneakers?|boots?|sandals?|slippers?|loafers?|heels?|flats?|footwear|espadrilles?|clogs?|mules?|pumps?)\b/i;
const NOT_FOOTWEAR_CAT = /\b(care|accessor|insole|lace|polish|rack|bag|sock)\b/i;

let requestCount = 0;
async function cjGet(endpoint) {
  requestCount++;
  return apiClient.get(endpoint);
}

function pointsNow() {
  const pi = getLastPointsInfo();
  return pi && typeof pi.remaining === "number" ? pi.remaining : "?";
}

// ---- 1. Fetch category tree ----
async function fetchCategoryTree() {
  console.log("→ Fetching CJ category tree (getCategory)…");
  const data = await cjGet(CJ_CONFIG.CATEGORY.LIST);
  return data; // array of { categoryFirstName, categoryFirstList:[{ categorySecondName, categorySecondList:[{categoryId, categoryName}] }] }
}

// Flatten tree → list of leaf categories with their full path.
function flattenFootwear(tree) {
  const out = [];
  const arr = Array.isArray(tree) ? tree : [];
  for (const first of arr) {
    const f = first.categoryFirstName || "";
    for (const second of first.categoryFirstList || []) {
      const s = second.categorySecondName || "";
      for (const leaf of second.categorySecondList || []) {
        const name = leaf.categoryName || "";
        const path = `${f} / ${s} / ${name}`;
        const hay = `${f} ${s} ${name}`;
        const isFoot = FOOTWEAR_CAT.test(hay) && !NOT_FOOTWEAR_CAT.test(name);
        if (isFoot) out.push({ categoryId: leaf.categoryId, name, path });
      }
    }
  }
  return out;
}

// Read CJ's REAL totalRecords/totalPages from a raw listV2 response (the current
// code discards these — here we read them directly).
function readMeta(raw) {
  // listV2 shape: data.content[0].productList + data.totalRecords/totalPages,
  // OR data[0].list + data.pageNum/total (per docs both shapes exist).
  const d = raw;
  let list = [];
  let total = null, totalPages = null;
  if (Array.isArray(d)) {
    list = d[0]?.list || [];
  } else if (d?.content) {
    list = d.content[0]?.productList || [];
    total = d.totalRecords ?? null;
    totalPages = d.totalPages ?? null;
  }
  if (total == null && d?.total != null) total = d.total;
  return { list, total, totalPages };
}

async function sampleSource(label, buildEndpoint) {
  const seen = new Set();
  let gross = 0, pages = 0, firstTotal = null, firstTotalPages = null;
  for (let page = 1; page <= DEEP_PAGES; page++) {
    let raw;
    try {
      raw = await cjGet(buildEndpoint(page));
    } catch (e) {
      console.log(`   ${label} page ${page} failed: ${e.message}`);
      break;
    }
    const { list, total, totalPages } = readMeta(raw);
    if (page === 1) { firstTotal = total; firstTotalPages = totalPages; }
    if (!list.length) break;
    pages++;
    for (const p of list) {
      gross++;
      const id = p.id || p.pid;
      if (id) seen.add(String(id));
    }
    if (list.length < PAGE_SIZE) break; // last page
  }
  return {
    label,
    unique: seen.size,
    gross,
    pagesCrawled: pages,
    dupRate: gross ? (((gross - seen.size) / gross) * 100).toFixed(1) : "0",
    uniquePerRequest: pages ? (seen.size / pages).toFixed(1) : "0",
    cjTotalRecords: firstTotal,
    cjTotalPages: firstTotalPages,
  };
}

(async () => {
  console.log("=== CJ CATEGORY vs KEYWORD — read-only efficiency measurement ===");
  console.log(`budget: ~${1 + SAMPLE_CATEGORIES * DEEP_PAGES + SAMPLE_KEYWORDS * DEEP_PAGES} requests max`);
  console.log(`points remaining at start: ${pointsNow()}\n`);

  // 1. Category tree
  const tree = await fetchCategoryTree();
  const footwear = flattenFootwear(tree);
  console.log(`\n✓ Found ${footwear.length} footwear leaf categories in CJ's tree:`);
  footwear.slice(0, 30).forEach((c) => console.log(`   ${c.categoryId}  ${c.path}`));
  if (!footwear.length) {
    console.log("   ⚠ No footwear categories matched — dumping first 40 leaf names for inspection:");
    // fallback dump so we can tune the regex
    const arr = Array.isArray(tree) ? tree : [];
    let n = 0;
    for (const f of arr) for (const s of f.categoryFirstList || []) for (const leaf of s.categorySecondList || []) {
      if (n++ < 40) console.log(`     · ${f.categoryFirstName} / ${s.categorySecondName} / ${leaf.categoryName}`);
    }
    process.exit(0);
  }

  // 2. Sample category crawling
  console.log(`\n→ Sampling ${SAMPLE_CATEGORIES} footwear categories (${DEEP_PAGES} pages each)…`);
  const catResults = [];
  for (const c of footwear.slice(0, SAMPLE_CATEGORIES)) {
    const r = await sampleSource(`cat:${c.name}`, (page) =>
      `${CJ_CONFIG.PRODUCT.LIST_V2}?page=${page}&size=${PAGE_SIZE}&categoryId=${c.categoryId}&features=enable_description,enable_category`
    );
    catResults.push(r);
    console.log(`   ${r.label}: ${r.unique} unique / ${r.pagesCrawled} req = ${r.uniquePerRequest}/req · dup ${r.dupRate}% · CJ says total=${r.cjTotalRecords ?? "?"}`);
  }

  // 3. Sample keyword crawling (same budget shape)
  console.log(`\n→ Sampling ${SAMPLE_KEYWORDS} current keywords (${DEEP_PAGES} pages each)…`);
  const kwSample = categoryKeywords.slice(0, SAMPLE_KEYWORDS);
  const kwResults = [];
  for (const k of kwSample) {
    const r = await sampleSource(`kw:${k.keyword}`, (page) =>
      `${CJ_CONFIG.PRODUCT.LIST_V2}?page=${page}&size=${PAGE_SIZE}&keyWord=${encodeURIComponent(k.keyword)}&features=enable_description,enable_category`
    );
    kwResults.push(r);
    console.log(`   ${r.label}: ${r.unique} unique / ${r.pagesCrawled} req = ${r.uniquePerRequest}/req · dup ${r.dupRate}% · CJ says total=${r.cjTotalRecords ?? "?"}`);
  }

  // 4. Cross-source uniqueness: how much do CATEGORY samples overlap each other vs KEYWORD samples?
  // (Re-crawl not needed; we already have IDs implicitly via per-source seen sets — but we didn't keep them.
  //  For a quick cross-overlap signal, re-run page1-only per source into a global set.)
  console.log(`\n→ Cross-overlap check (page 1 only per source)…`);
  async function globalUnique(sources, buildEndpoint) {
    const g = new Set(); let grossG = 0;
    for (const s of sources) {
      try {
        const raw = await cjGet(buildEndpoint(s));
        const { list } = readMeta(raw);
        for (const p of list) { grossG++; const id = p.id || p.pid; if (id) g.add(String(id)); }
      } catch {}
    }
    return { unique: g.size, gross: grossG };
  }
  const catGlobal = await globalUnique(footwear.slice(0, SAMPLE_CATEGORIES), (c) =>
    `${CJ_CONFIG.PRODUCT.LIST_V2}?page=1&size=${PAGE_SIZE}&categoryId=${c.categoryId}&features=enable_description,enable_category`);
  const kwGlobal = await globalUnique(kwSample, (k) =>
    `${CJ_CONFIG.PRODUCT.LIST_V2}?page=1&size=${PAGE_SIZE}&keyWord=${encodeURIComponent(k.keyword)}&features=enable_description,enable_category`);

  // 5. Report
  const avg = (rs) => (rs.reduce((a, r) => a + Number(r.uniquePerRequest), 0) / (rs.length || 1)).toFixed(1);
  const sumUnique = (rs) => rs.reduce((a, r) => a + r.unique, 0);
  const avgDup = (rs) => (rs.reduce((a, r) => a + Number(r.dupRate), 0) / (rs.length || 1)).toFixed(1);

  console.log("\n================= REPORT =================");
  console.log("CATEGORY-based:");
  console.log(`   avg unique/request : ${avg(catResults)}`);
  console.log(`   avg in-source dup% : ${avgDup(catResults)}`);
  console.log(`   cross-source: ${catGlobal.unique} unique from ${catGlobal.gross} gross (page1) → ${(100*(catGlobal.gross-catGlobal.unique)/(catGlobal.gross||1)).toFixed(1)}% cross-overlap`);
  console.log("KEYWORD-based:");
  console.log(`   avg unique/request : ${avg(kwResults)}`);
  console.log(`   avg in-source dup% : ${avgDup(kwResults)}`);
  console.log(`   cross-source: ${kwGlobal.unique} unique from ${kwGlobal.gross} gross (page1) → ${(100*(kwGlobal.gross-kwGlobal.unique)/(kwGlobal.gross||1)).toFixed(1)}% cross-overlap`);
  console.log("-----------------------------------------");
  console.log(`total CJ requests spent: ${requestCount}`);
  console.log(`points remaining at end: ${pointsNow()}`);
  console.log(`footwear categories available for a full crawl: ${footwear.length}`);
  const catSumTotal = catResults.reduce((a,r)=> a + (Number(r.cjTotalRecords)||0), 0);
  console.log(`CJ-reported total products across sampled categories: ${catSumTotal} (extrapolate × ${footwear.length}/${SAMPLE_CATEGORIES} for full footwear catalog estimate)`);
  console.log("=========================================");
})();
