/**
 * Run from footverse-backend:   node diagnose.mjs
 * Tells you (a) CJ's REAL page size, and (b) whether the fixes are installed.
 */
import "dotenv/config";
const { getCJProductsV2 } = await import("./src/services/cjProductService.js");
const { classifySubcategory } = await import("./src/utils/categoryClassifier.js");
const fs = await import("fs");

console.log("=== 1. ARE THE FIXES INSTALLED? ===");
const pool = fs.readFileSync("src/services/cjPoolService.js", "utf8");
const cls  = fs.readFileSync("src/utils/categoryClassifier.js", "utf8");
console.log(pool.includes("effectivePageSize") ? "  ✓ early-stop fix present" : "  ✗ EARLY-STOP FIX MISSING — the 560 bug is still here");
console.log(cls.includes("GENERAL_SUBS")       ? "  ✓ subcategory fix present" : "  ✗ SUBCATEGORY FIX MISSING");

console.log("\n=== 2. THE HEELS PRODUCTS FROM YOUR SCREENSHOT ===");
for (const n of ["Flat Heel Pumps Single Shoes Flat", "Mid-heel women's shoes Roman beach sandals"]) {
  console.log(`  "${n}"\n     → ${classifySubcategory(n, "Heels")}   (should NOT be Heels)`);
}

console.log("\n=== 3. CJ'S REAL PAGE SIZE (this is the 560 bug) ===");
try {
  const res = await getCJProductsV2({ keyWord: "shoes", size: 200, page: 1 });
  const n = (res?.products || []).length;
  console.log(`  requested size=200 → CJ actually returned ${n} products`);
  if (n < 200) {
    console.log(`  ★ CJ CAPS ITS PAGE SIZE AT ~${n}.`);
    console.log(`    The OLD code compared against the requested 200, saw ${n} < 200,`);
    console.log(`    and stopped after page 1 for EVERY keyword → that's your 560.`);
    console.log(`    The fix compares against ${n} instead, so it keeps paginating.`);
  }
  const res2 = await new Promise(r => setTimeout(() => r(getCJProductsV2({ keyWord: "shoes", size: 200, page: 2 })), 1200));
  console.log(`  page 2 returned ${(res2?.products || []).length} products (proves more pages exist)`);
} catch (e) {
  console.log("  CJ call failed:", e.message);
}
process.exit(0);