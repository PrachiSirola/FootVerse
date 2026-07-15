import 'dotenv/config';
import { connectRedis } from './src/config/redisClient.js';
import { loadPoolShards, PRODUCT_PREFIX } from './src/utils/cache.js';

await connectRedis();
const pool = (await loadPoolShards(PRODUCT_PREFIX + 'pool')) || [];

// Current category distribution in the pool
const cat = {};
for (const p of pool) cat[p.category] = (cat[p.category]||0)+1;
console.log('CURRENT pool category totals:');
for (const c of Object.keys(cat).sort((a,b)=>cat[b]-cat[a])) console.log('  ' + String(cat[c]).padStart(5) + '  ' + c);

// If Women is already ~1300+, redistribution ALREADY happened. If Women ~327, it did NOT.
console.log('\nDIAGNOSIS:');
if ((cat.Women||0) > 900) {
  console.log('  ✓ Women =', cat.Women, '— redistribution ALREADY applied (via the re-crawl through the new transformer).');
  console.log('    reclassify reports 0 moved because there is nothing left to move. This is CORRECT.');
} else {
  console.log('  ✗ Women =', cat.Women, '— redistribution NOT applied. Something is wrong; investigate further.');
}
process.exit(0);
