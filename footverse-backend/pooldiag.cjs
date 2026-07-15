const { createClient } = require('redis');

// The frontend's OFFERED category>sub combos, derived from the keyword catalog.
// (These are the pages that actually exist on the storefront.)
(async () => {
  const r = createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' });
  await r.connect();

  const raw = await r.get('fv:products:pool');
  if (!raw) { console.log('NO POOL at fv:products:pool — try fv:products:pool:lastComplete'); await r.disconnect(); return; }
  const pool = JSON.parse(raw);
  console.log('pool size:', pool.length, '\n');

  // Actual counts by category>sub in the pool
  const counts = {};
  for (const p of pool) {
    const key = (p.category || '?') + ' > ' + (p.subcategory || '?');
    counts[key] = (counts[key] || 0) + 1;
  }

  // What the frontend OFFERS (edit this to match your real nav if different)
  const OFFERED = {
    Men:   ['Sneakers','Casual','Formal','Loafers','Running','Sports','Boots','Slippers','Sandals'],
    Women: ['Sandals','Slippers','Heels','Flats','Sneakers','Casual','Formal','Boots','Loafers'],
    Kids:  ['Sneakers','Sports','Sandals','Boots'],
    Sports:['Football','Basketball','Hiking'],
  };

  console.log('=== OFFERED PAGES: count in pool ===');
  const empty = [];
  for (const cat of Object.keys(OFFERED)) {
    for (const sub of OFFERED[cat]) {
      const k = cat + ' > ' + sub;
      const n = counts[k] || 0;
      if (n === 0) empty.push(k);
      console.log((n === 0 ? '  ✗ EMPTY  ' : '  ok ' + String(n).padStart(5) + ' ') + k);
    }
  }

  console.log('\n=== ORPHANS: products tagged with a combo NO page offers ===');
  const offeredSet = new Set(Object.entries(OFFERED).flatMap(([c,subs]) => subs.map(s => c+' > '+s)));
  let orphanTotal = 0;
  for (const k of Object.keys(counts).sort()) {
    if (!offeredSet.has(k)) { console.log('  ' + String(counts[k]).padStart(5) + '  ' + k); orphanTotal += counts[k]; }
  }
  console.log('\norphaned products (invisible on site):', orphanTotal);
  console.log('empty offered pages:', empty.length, '→', empty.join(' | '));

  await r.disconnect();
})();
