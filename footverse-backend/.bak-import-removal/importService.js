import Product from "../models/Product.js";
import { getCJProductsV2 } from "./cjProductService.js";
import { transformCJProduct } from "../transformers/productTransformer.js";

const FOOTWEAR = [
  "shoe",
  "shoes",
  "sneaker",
  "sneakers",
  "boot",
  "boots",
  "loafer",
  "loafers",
  "heel",
  "heels",
  "flat",
  "flats",
  "running",
  "walking",
  "sandal",
  "sandals",
  "slipper",
  "slippers",
];

function isFootwear(product) {
  const name = (product.nameEn || "").toLowerCase();
  return FOOTWEAR.some((word) => name.includes(word));
}

export async function importCategory({
  keyword,
  category,
  subcategory,
}) {
  console.log(
    `\nImporting ${category} > ${subcategory} (${keyword})`
  );

  const { products } = await getCJProductsV2({
    keyWord: keyword,
    page: 1,
    size: 50,
  });

  console.log("=================================");
  console.log("Keyword:", keyword);
  console.log("Products:", products.length);

  if (products.length > 0) {
    console.log("First Product ID:", products[0].id);
    console.log("First Product Name:", products[0].nameEn);
  }
  console.log("=================================");

  console.log(`CJ returned ${products.length} products`);

  let imported = 0;
  let duplicates = 0;

  for (const item of products) {
    if (!isFootwear(item)) continue;

    const transformed = transformCJProduct(
      item,
      category,
      subcategory
    );

    const exists = await Product.findOne({
      sourceProductId: transformed.sourceProductId,
    });

    if (exists) {
      duplicates++;

      exists.category = category;
      exists.subcategory = subcategory;
      
      await exists.save();

      continue;

    }
    await Product.create(transformed);
    imported++;
  }

  return {
    keyword,
    total: products.length,
    imported,
    duplicates,
  };
}