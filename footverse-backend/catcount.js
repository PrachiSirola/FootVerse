const mongoose = require('mongoose');
(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/footverse');
  const cols = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:');
  for (const c of cols) {
    const n = await mongoose.connection.db.collection(c.name).countDocuments();
    console.log(`  ${c.name}: ${n}`);
  }
  await mongoose.disconnect();
})();
