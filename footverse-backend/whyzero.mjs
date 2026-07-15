// Proves whether the on-disk classifier moves products, and whether the patch landed.
import 'dotenv/config';
import { connectRedis } from './src/config/redisClient.js';
import { loadPoolShards, PRODUCT_PREFIX } from './src/utils/cache.js';
import { classifyCategory, classifySubcategory } from './src/utils/categoryClassifier.js';
import { readFileSync } from 'fs';

// 1. Is the NEW classifier actually on disk? Check for the distribution markers.
const src = readFileSync('./src/utils/categoryClassifier.js', 'utf8');
const hasSplit   = src.includes('stableBucket');
const hasWomenType = src.includes('WOMEN_TYPE_WORDS');
const has3rdArg  = /classifyCategory\(name = "", fallback = "", id = ""\)/.test(src);
console.log('PATCH CHECK:');
console.log('  stableBucket present     :', hasSplit);
console.log('  WOMEN_TYPE_WORDS present :', hasWomenType);
console.log('  classifyCategory(id) arg :', has3rdArg);
if (!hasSplit || !hasWomenType || !has3rdArg) {
  console.log('\n  ✗ The on-disk classifier is the OLD one (or truncated). That is why 0 moved.');
  process.exit(0);
}
console.log('  ✓ New classifier is on disk.\n');

// 2. Run it against the real pool and count would-be moves.
await connectRedis();
const pool = (await loadPoolShards(PRODUCT_PREFIX + 'pool')) || [];
console.log('pool loaded:', pool.length, 'products');

let move = 0, noSignal = 0, flips = {};
const WORD = /\b(men|man|mens|male|women|woman|womens|ladies|lady|female|girl|kid|kids|child|children|toddler|baby|infant|boys?|girls?|junior|youth)\b/i;
for (const p of pool) {
  if (!WORD.test(p.name||'')) noSignal++;
  const c = classifyCategory(p.name, p.category, p._id || p.id);
  const s = classifySubcategory(p.name, p.subcategory, c);
  if (c !== p.category || s !== p.subcategory) {
    move++;
    const k = p.category + '→' + c;
    flips[k] = (flips[k]||0)+1;
  }
}
console.log('no-signal products in pool:', noSignal);
console.log('WOULD move on reclassify   :', move);
console.log('\ncategory flips:');
for (const k of Object.keys(flips).sort((a,b)=>flips[b]-flips[a])) console.log('  ' + k + ': ' + flips[k]);

// 3. Sample: show 5 no-signal products and their current vs new category
console.log('\nsample no-signal products (current → new):');
let shown = 0;
for (const p of pool) {
  if (WORD.test(p.name||'')) continue;
  const c = classifyCategory(p.name, p.category, p._id || p.id);
  console.log('  "' + (p.name||'').slice(0,45) + '"  ' + p.category + ' → ' + c);
  if (++shown >= 5) break;
}
process.exit(0);
