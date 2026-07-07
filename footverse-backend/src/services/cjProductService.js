import CJ_CONFIG from "../config/cjConfig.js";
import { apiClient } from "../utils/apiClient.js";

export async function getCJProductsV2(query = {}) {
  const params = new URLSearchParams();

  // Pagination
  params.append("page", query.page || 1);
  params.append("size", query.size || 20);

  // Search
  if (query.keyWord)
    params.append("keyWord", query.keyWord);

  // Category
  if (query.categoryId)
    params.append("categoryId", query.categoryId);

  // Warehouse Country
  if (query.countryCode)
    params.append("countryCode", query.countryCode);

  // Price Filters
  if (query.startSellPrice)
    params.append("startSellPrice", query.startSellPrice);

  if (query.endSellPrice)
    params.append("endSellPrice", query.endSellPrice);

  // Sorting
  if (query.orderBy)
    params.append("orderBy", query.orderBy);

  if (query.sort)
    params.append("sort", query.sort);

  // Extra Features
  params.append(
    "features",
    "enable_description,enable_category"
  );

  const endpoint =
    `${CJ_CONFIG.PRODUCT.LIST_V2}?${params.toString()}`;

  console.log("\n========== CJ REQUEST ==========");
  console.log(endpoint);

  const data = await apiClient.get(endpoint);

  console.log("\n========== CJ RESPONSE ==========");
  console.dir(data, { depth: null });

  let rawProducts = [];

  /**
   * ----------------------------------------------------
   * New API Structure
   * data = [
   *   {
   *      list:[]
   *   }
   * ]
   * ----------------------------------------------------
   */
  if (Array.isArray(data)) {
    rawProducts = data[0]?.list || [];
  }

  /**
   * ----------------------------------------------------
   * Old API Structure
   * data.content = [...]
   * ----------------------------------------------------
   */
  else if (Array.isArray(data.content)) {
    rawProducts =
      data.content[0]?.productList || [];
  }

  /**
   * ----------------------------------------------------
   * Old API Structure
   * data.content.productList
   * ----------------------------------------------------
   */
  else if (data.content?.productList) {
    rawProducts =
      data.content.productList;
  }

  /**
   * ----------------------------------------------------
   * Fallback
   * ----------------------------------------------------
   */
  else if (data.productList) {
    rawProducts =
      data.productList;
  }

  console.log(
    `\n✅ Products Found : ${rawProducts.length}\n`
  );
  console.log("First Product ID:", rawProducts[0]?.id);
  console.log("First Product Name:", rawProducts[0]?.nameEn);

  return {
    success: true,

    keyword: query.keyWord || "",

    page: query.page || 1,

    pageSize: query.size || 20,

    totalRecords: rawProducts.length,

    relatedCategories:
      data.relatedCategoryList ||
      data.content?.relatedCategoryList ||
      [],

    products: rawProducts,
  };
}