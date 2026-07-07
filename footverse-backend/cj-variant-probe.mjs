import "dotenv/config";
import CJ_CONFIG from "./src/config/cjConfig.js";
import { apiClient } from "./src/utils/apiClient.js";

const pid = process.argv[2];
if (!pid) {
  console.log("Usage: node cj-variant-probe.mjs <cjProductId>");
  process.exit(1);
}

try {
  const detail = await apiClient.get(`${CJ_CONFIG.PRODUCT.DETAILS}?pid=${encodeURIComponent(pid)}`);
  console.log("TOP-LEVEL KEYS:", Object.keys(detail || {}));
  const variants = detail?.variants || detail?.variantList || detail?.variantInfoList || [];
  console.log("VARIANT COUNT:", variants.length);
  if (variants.length === 0) {
    console.dir(detail, { depth: 3 });
  } else {
    console.log("FIRST VARIANT KEYS:", Object.keys(variants[0]));
    console.dir(variants.slice(0, 3), { depth: null });
  }
} catch (err) {
  console.error("CJ detail call failed:", err.message);
}
process.exit(0);