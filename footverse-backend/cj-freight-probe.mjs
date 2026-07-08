import "dotenv/config";
import CJ_CONFIG from "./src/config/cjConfig.js";
import { apiClient } from "./src/utils/apiClient.js";

const vid = process.argv[2];
const country = process.argv[3] || "IN";
if (!vid) {
  console.log("Usage: node cj-freight-probe.mjs <cjVariantId> <countryCode>");
  process.exit(1);
}

const attempts = [
  { label: "shape A", body: { startCountryCode: "CN", endCountryCode: country, zip: "", products: [{ vid, quantity: 1 }] } },
  { label: "shape B", body: { countryCode: country, vid, quantity: 1 } },
  { label: "shape C", body: { startCountryCode: "CN", endCountryCode: country, products: [{ variantId: vid, quantity: 1 }] } },
];

console.log(`\nEndpoint: ${CJ_CONFIG.BASE_URL}${CJ_CONFIG.ORDER.CALCULATE}\n`);
for (const a of attempts) {
  console.log(`\n===== ${a.label} =====`);
  console.log("REQUEST:", JSON.stringify(a.body));
  try {
    const res = await apiClient.post(CJ_CONFIG.ORDER.CALCULATE, a.body);
    console.log("RESPONSE:");
    console.dir(res, { depth: 4 });
  } catch (err) {
    console.log("FAILED:", err.message);
  }
  await new Promise((r) => setTimeout(r, 1500));
}
process.exit(0);