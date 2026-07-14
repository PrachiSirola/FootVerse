/**
 * READ-ONLY. Makes NO changes and NO CJ calls.
 * Shows what is actually in your Redis pool so we can find the real problem.
 *
 *   node inspect.mjs
 */
import "dotenv/config";

const { connectRedis } = await import("./src/config/redisClient.js");
await connectRedis();

const cache = await import("./src/utils/cache.js");
const { classifyCategory, classifySubcategory } = await import("./src/utils/categoryClassifier.js");

const PREFIX = cache.PRODUCT_PREFIX || "fv:products:";
const pool = (await cache.cacheGet(`${PREFIX}pool`)) || [];
const meta = (await cache.cacheGet(`${PREFIX}pool:meta`)) || null;

console.log("\n══════════════════════════════════════════════");
console.log(` Products in Redis : ${pool.length}`);
if (meta) console.log(` Pool complete?    : ${meta.complete}`);
console.log("══════════════════════════════════════════════\n");

if (!pool.length) {
  console.log("The pool is EMPTY. Start the server and let it warm.");
  process.exit(0);
}

/* 1. What the SITE is currently showing (the categories baked into the cache) */
const cached = {};
for (const p of pool) {
  const k = `${p.category ?? "?"} > ${p.subcategory ?? "?"}`;
  cached[k] = (cached[k] || 0) + 1;
}
console.log("=== 1. WHAT'S IN REDIS NOW (this is what the site shows) ===");
for (const k of Object.keys(cached).sort()) {
  console.log(`   ${k.padEnd(30)} ${cached[k]}`);
}

/* 2. What the CURRENT classifier would produce (nothing is changed) */
const would = {};
for (const p of pool) {
  const c = classifyCategory(p.name || "", p.category || "");
  const s = classifySubcategory(p.name || "", p.subcategory || "", c);
  const k = `${c} > ${s}`;
  would[k] = (would[k] || 0) + 1;
}
console.log("\n=== 2. WHAT THE CURRENT CLASSIFIER WOULD GIVE THEM ===");
for (const k of Object.keys(would).sort()) {
  console.log(`   ${k.padEnd(30)} ${would[k]}`);
}

/* 3. Real product names — so I can see what CJ actually returns */
console.log("\n=== 3. 20 REAL PRODUCT NAMES FROM YOUR POOL ===");
for (const p of pool.slice(0, 20)) {
  const c = classifyCategory(p.name || "", p.category || "");
  const s = classifySubcategory(p.name || "", p.subcategory || "", c);
  console.log(`   "${p.name}"`);
  console.log(`        in redis: ${p.category} > ${p.subcategory}`);
  console.log(`        would be: ${c} > ${s}`);
}

console.log("\n── Nothing was changed. Paste sections 1, 2 and 3 back to me. ──\n");
process.exit(0);