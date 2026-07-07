import CJ_CONFIG from "../config/cjConfig.js";
import { apiClient } from "../utils/apiClient.js";

/**
 * Fetch Categories from CJ
 */
export async function getCJCategories() {
  const endpoint = CJ_CONFIG.CATEGORY.LIST;

  return await apiClient.get(endpoint);
}