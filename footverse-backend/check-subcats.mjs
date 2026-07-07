import "dotenv/config";
import mongoose from "mongoose";
import Product from "./src/models/Product.js";

const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/footverse";
await mongoose.connect(uri);

const rows = await Product.aggregate([
  { $group: { _id: { c: "$category", s: "$subcategory" }, n: { $sum: 1 } } },
  { $sort: { "_id.c": 1, "_id.s": 1 } },
]);

const total = await Product.countDocuments();
console.log(`\nTotal products in DB: ${total}\n`);
console.log("Category            | Subcategory      | Count");
console.log("--------------------|------------------|------");
for (const r of rows) {
  const c = String(r._id.c || "(none)").padEnd(19);
  const s = String(r._id.s || "(none)").padEnd(16);
  console.log(`${c}| ${s} | ${r.n}`);
}

const cats = await Product.distinct("category");
const subs = await Product.distinct("subcategory");
console.log("\nDistinct categories:", JSON.stringify(cats));
console.log("Distinct subcategories:", JSON.stringify(subs));

await mongoose.disconnect();
