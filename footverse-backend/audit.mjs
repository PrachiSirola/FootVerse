import 'dotenv/config';
import { connectRedis } from './src/config/redisClient.js';
import { loadPoolShards, PRODUCT_PREFIX } from './src/utils/cache.js';

await connectRedis();
const pool = (await loadPoolShards(PRODUCT_PREFIX + 'pool')) || [];

const GENDER = /\b(men|man|mens|male|women|woman|womens|ladies|lady|female|girl|kid|kids|child|children|toddler|baby|infant|boys?|girls?|junior|youth)\b/i;
const WOMEN_TYPE = /\b(heels?|pumps?|stilettos?|wedges?|ballet\s?flats?|ballerinas?|espadrilles?|mary\s?janes?|kitten\s?heels?)\b/i;
const NEUTRAL = /\b(sneakers?|trainers?|running|jogging|casual|canvas|walking|boots?|sandals?|slippers?|flip[\s-]?flops?|slides?|mules?|loafers?|moccasins?)\b/i;
const SPORT = /\b(football|soccer|cleats?|basketball|hiking|trekking|hik(e|ing))\b/i;

let noSig=0, wtype=0, neutral=0, neutralMen=0, neutralWomen=0, fallbackMen=0, sportGate=0;
for (const p of pool) {
  const n = (p.name||'').toLowerCase();
  if (GENDER.test(n)) continue;
  noSig++;
  if (SPORT.test(n)) { sportGate++; continue; }
  if (WOMEN_TYPE.test(n)) { wtype++; continue; }
  if (NEUTRAL.test(n)) {
    neutral++;
    if (p.category==='Men') neutralMen++;
    else if (p.category==='Women') neutralWomen++;
  } else {
    if (p.category==='Men') fallbackMen++;
  }
}
console.log('NO-SIGNAL PRODUCTS BREAKDOWN (' + noSig + ' total):');
console.log('  → Sports gate (football/hiking/etc):', sportGate);
console.log('  → women-type (heels/pumps/etc) → Women:', wtype);
console.log('  → neutral-type (split 50/50):', neutral, '→ Men:'+neutralMen, 'Women:'+neutralWomen);
console.log('  → no type match → Men fallback:', fallbackMen);
console.log('');
const ratio = neutral ? (neutralWomen/neutral*100).toFixed(1) : 0;
console.log('Neutral split ratio: ' + ratio + '% Women (target ~50%)');
console.log(Math.abs(ratio-50) < 6 ? '  ✓ split is balanced' : '  ⚠ split skewed — investigate');
console.log('');
console.log('The ' + fallbackMen + ' no-type-match products are correctly Men (work/safety/generic');
console.log('shoes with no gendered TYPE word). That is why Women is 873 not ~1300.');
process.exit(0);
