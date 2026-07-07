import Product from "../models/Product.js";

/**
 * Get all products
 */
export async function getProductsFromDB() {
  return await Product.find().lean();
}

/**
 * Get one product
 */
export async function getProductById(id) {
  return await Product.findOne({
    cjProductId: id,
  }).lean();
}