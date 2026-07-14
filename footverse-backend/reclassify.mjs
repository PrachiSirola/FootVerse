/**
 * Re-classify the products ALREADY cached in Redis. ZERO CJ API calls.
 *
 *   node reclassify.mjs
 *
 * Use this after any classifier change instead of flushing Redis — flushing
 * forces a full re-crawl and burns your CJ rate limit for no reason.
 */
import "dotenv/config";

const { connectRedis } = await import("./src/config/redisClient.js");
await connectRedis();

const { reclassifyPool } = await import("./src/services/productStore.js");

console.log("Re-classifying the cached pool (no CJ calls)…\n");
const r = await reclassifyPool();

if (!r.ok) {
  console.log("✗", r.message);
  process.exit(1);
}

console.log("\n=== BEFORE ===");
for (const k of Object.keys(r.before).sort()) console.log(`  ${k}: ${r.before[k]}`);

console.log("\n=== AFTER ===");
for (const k of Object.keys(r.after).sort()) console.log(`  ${k}: ${r.after[k]}`);

console.log(`\n✓ ${r.total} products re-classified — ${r.changed} moved to a different category.`);
console.log("  The response cache was cleared, so the site now serves the new categories.");
process.exit(0);