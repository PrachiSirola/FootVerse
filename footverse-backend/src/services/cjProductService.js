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
  // CJ's REAL paging metadata. The old code discarded these and substituted
  // rawProducts.length, leaving the crawler blind to how many pages a source
  // actually has (the root cause of paging deep into duplicates). We now read
  // CJ's own totalRecords/totalPages so the crawler can stop at the true end.
  let totalRecords = null;
  let totalPages = null;
  let pageNumber = null;

  /**
   * ----------------------------------------------------
   * New API Structure
   * data = [ { list:[] } ]   (may also carry pageNum/total/pageSize)
   * ----------------------------------------------------
   */
  if (Array.isArray(data)) {
    rawProducts = data[0]?.list || [];
    totalRecords = data[0]?.total ?? data.total ?? null;
    pageNumber = data[0]?.pageNum ?? null;
  }

  /**
   * ----------------------------------------------------
   * API Structure: data.content = [ { productList:[] } ]
   * with data.totalRecords / data.totalPages / data.pageNumber
   * ----------------------------------------------------
   */
  else if (Array.isArray(data.content)) {
    rawProducts = data.content[0]?.productList || [];
    totalRecords = data.totalRecords ?? null;
    totalPages = data.totalPages ?? null;
    pageNumber = data.pageNumber ?? null;
  }

  /**
   * ----------------------------------------------------
   * API Structure: data.content.productList
   * ----------------------------------------------------
   */
  else if (data.content?.productList) {
    rawProducts = data.content.productList;
    totalRecords = data.content.totalRecords ?? data.totalRecords ?? null;
    totalPages = data.content.totalPages ?? data.totalPages ?? null;
    pageNumber = data.content.pageNumber ?? data.pageNumber ?? null;
  }

  /**
   * ----------------------------------------------------
   * Fallback
   * ----------------------------------------------------
   */
  else if (data.productList) {
    rawProducts = data.productList;
    totalRecords = data.totalRecords ?? null;
    totalPages = data.totalPages ?? null;
    pageNumber = data.pageNumber ?? null;
  }

  // Derive totalPages if CJ only gave totalRecords (and we know the page size).
  const effSize = Number(query.size) || 20;
  if (totalPages == null && totalRecords != null && effSize > 0) {
    totalPages = Math.ceil(Number(totalRecords) / effSize);
  }

  console.log(
    `\n✅ Products Found : ${rawProducts.length}\n`
  );
  console.log("First Product ID:", rawProducts[0]?.id);
  console.log("First Product Name:", rawProducts[0]?.nameEn);

  return {
    success: true,

    keyword: query.keyWord || "",
    categoryId: query.categoryId || "",

    page: Number(query.page) || 1,
    pageSize: effSize,

    // CJ's REAL totals (null if CJ didn't provide them). `pageCount` is the
    // number returned on THIS page — kept separate from totalRecords so the
    // crawler can tell "short page = last page" from "catalog is this big".
    totalRecords: totalRecords != null ? Number(totalRecords) : null,
    totalPages: totalPages != null ? Number(totalPages) : null,
    pageNumber: pageNumber != null ? Number(pageNumber) : (Number(query.page) || 1),
    pageCount: rawProducts.length,

    relatedCategories:
      data.relatedCategoryList ||
      data.content?.relatedCategoryList ||
      [],

    products: rawProducts,
  };
}