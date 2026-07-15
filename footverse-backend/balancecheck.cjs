const { createClient } = require('redis');
(async () => {
  const r = createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' });
  await r.connect();
  const pool = JSON.parse(await r.get('fv:products:pool'));
  await r.disconnect();

  // Category-level totals
  const cat = {};
  for (const p of pool) cat[p.category] = (cat[p.category]||0)+1;
  console.log('=== CATEGORY TOTALS ===');
  for (const c of Object.keys(cat).sort((a,b)=>cat[b]-cat[a])) console.log('  ' + String(cat[c]).padStart(5) + '  ' + c);

  // If Women/Kids are thin, is it because CJ names lack gender words?
  // Count how many pool items even CONTAIN women/men/kids signal words.
  const rx = {
    womenword: /\b(women|woman|womens|ladies|lady|female|girl)\b/i,
    menword:   /\b(men|man|mens|male|gentleman)\b/i,
    kidword:   /\b(kid|kids|child|children|toddler|baby|infant|boys?|girls?|junior|youth)\b/i,
    nosignal:  null,
  };
  let w=0,m=0,k=0,none=0;
  for (const p of pool) {
    const n = p.name || '';
    const hw = rx.womenword.test(n), hm = rx.menword.test(n), hk = rx.kidword.test(n);
    if (hw) w++; if (hm) m++; if (hk) k++;
    if (!hw && !hm && !hk) none++;
  }
  console.log('\n=== GENDER SIGNAL IN PRODUCT NAMES (of ' + pool.length + ') ===');
  console.log('  names containing women-word:', w);
  console.log('  names containing men-word:  ', m);
  console.log('  names containing kid-word:  ', k);
  console.log('  names with NO gender signal:', none, '(these default to Men via classifier fallback chain)');
  await r.disconnect().catch(()=>{});
})();
