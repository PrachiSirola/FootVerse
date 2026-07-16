import categoryKeywords from "../data/categoryKeywords.js";
import { importCategory } from "../services/importService.js";
import { invalidateProductCache } from "../utils/cache.js";

// Import a single category
export async function bulkImport(req, res) {
  try {
    const result = await importCategory(req.body);

    await invalidateProductCache();
    res.json(result);

  } catch (err) {
    console.error("\n========== BULK IMPORT ERROR ==========");
    console.error(err);
    console.error("=======================================\n");

    res.status(500).json({
      message: err.message,
      stack: err.stack,
    });
  }
}

// Import all categories
export async function importAll(req, res) {
    console.log("🔥 importAll route called");
  try {
    const results = [];

    for (const item of categoryKeywords) {
      console.log(`\n====================================`);
      console.log(`Importing: ${item.keyword}`);
      console.log(`Category: ${item.category}`);
      console.log(`Subcategory: ${item.subcategory}`);
      console.log(`====================================\n`);

      const result = await importCategory(item);

      results.push(result);
    }

    await invalidateProductCache();
    res.json({
      success: true,
      results,
    });

  } catch (err) {
    console.error("\n========== IMPORT ALL ERROR ==========");
    console.error(err);
    console.error("======================================\n");

    res.status(500).json({
      message: err.message,
      stack: err.stack,
    });
  }
}