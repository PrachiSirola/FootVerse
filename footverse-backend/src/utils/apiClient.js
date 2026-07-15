import fetch from "node-fetch";
import { getValidAccessToken } from "../services/cjAuthService.js";
import CJ_CONFIG from "../config/cjConfig.js";

/* ============================================================================
 * GLOBAL CJ RATE LIMITER
 *
 * CJ enforces QPS = 1 request/second. The pool builder has MULTIPLE loops that
 * can run at once on a cold start — buildFirstBatch(), the un-awaited
 * fillFullCatalogInBackground() → buildPool({deep}), and productSync's
 * resume/rebuild. Each loop had its own sleep(1100), but they don't know about
 * each other, so their requests interleaved: 2–3 hit CJ in the same second →
 * "Too Many Requests, QPS limit is 1 time/1second" → first batch returned 0 and
 * the pool never seeded in prod.
 *
 * Fix: funnel EVERY CJ request through one serialized queue that guarantees a
 * minimum gap between calls GLOBALLY, regardless of how many callers run
 * concurrently. This makes the QPS limit impossible to violate from within the
 * process, without any caller needing its own sleep.
 * ==========================================================================*/

// Minimum ms between the START of consecutive CJ requests. 1100 > 1000 gives
// headroom for clock/network jitter. Tunable via env if CJ ever relaxes/tightens.
const CJ_MIN_INTERVAL_MS = Number(process.env.CJ_MIN_INTERVAL_MS || 1100);

// A single promise chain = a mutex. Each request appends itself; the next can't
// start until the previous has waited out the interval. Shared across ALL loops
// because this module is a singleton.
let cjChain = Promise.resolve();
let lastStart = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Serialize `fn` behind the global CJ queue with ≥ CJ_MIN_INTERVAL_MS spacing. */
function scheduleCJ(fn) {
  const run = cjChain.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, lastStart + CJ_MIN_INTERVAL_MS - now);
    if (wait > 0) await sleep(wait);
    lastStart = Date.now();
    return fn();
  });
  // Keep the chain alive even if this call rejects, so one failure doesn't break
  // the queue for everyone behind it.
  cjChain = run.then(() => {}, () => {});
  return run;
}

const isQpsError = (msg = "") =>
  /too many requests|qps limit|1 time\/1second|frequenc/i.test(String(msg));

async function rawRequest(method, endpoint, body = null) {
  const token = await getValidAccessToken();
  const options = {
    method,
    headers: { "CJ-Access-Token": token, "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${CJ_CONFIG.BASE_URL}${endpoint}`, options);
  const result = await response.json();

  if (!result.result) {
    const err = new Error(result.message || "CJ API Error");
    err.isQps = isQpsError(result.message);
    throw err;
  }
  return result.data;
}

/**
 * Rate-limited request with a retry safety net: if CJ still returns a QPS error
 * (e.g. another CJ consumer outside this process), back off and retry a few
 * times instead of returning empty.
 */
async function request(method, endpoint, body = null) {
  const MAX_RETRIES = 4;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await scheduleCJ(() => rawRequest(method, endpoint, body));
    } catch (err) {
      if (err.isQps && attempt < MAX_RETRIES) {
        const backoff = CJ_MIN_INTERVAL_MS * attempt; // 1.1s, 2.2s, 3.3s…
        console.warn(`[cj] QPS hit — backing off ${backoff}ms (attempt ${attempt}/${MAX_RETRIES})`);
        await sleep(backoff);
        continue;
      }
      throw err;
    }
  }
}

export const apiClient = {
  get(endpoint) {
    return request("GET", endpoint);
  },
  post(endpoint, body) {
    return request("POST", endpoint, body);
  },
  put(endpoint, body) {
    return request("PUT", endpoint, body);
  },
  delete(endpoint) {
    return request("DELETE", endpoint);
  },
};