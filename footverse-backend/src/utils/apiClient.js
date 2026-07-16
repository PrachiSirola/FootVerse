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

// CJ charges API "points" per request. When they run low/out, CJ returns a 429
// with an "insufficient points" message. We track the latest pointsInfo from
// every response and expose a pause signal so the sync can stop BEFORE draining
// them, then resume once they replenish.
const isPointsError = (msg = "") =>
  /insufficient.*points?|not enough.*points?|points?.*(exhaust|insufficient|not enough)/i.test(String(msg));

// Latest pointsInfo seen on ANY CJ response. Shape mirrors CJ's envelope:
// { remaining, used, limit, ... } — we store whatever CJ sends plus a timestamp.
let lastPointsInfo = null;   // { remaining, ...raw, at }
let pointsPausedUntil = 0;   // epoch ms; > now means "don't call CJ yet"

/** Latest known CJ points state (null until the first CJ response). */
export function getLastPointsInfo() {
  return lastPointsInfo;
}

/** True while we're deliberately pausing CJ calls after a points-exhaustion 429. */
export function isPointsPaused() {
  return Date.now() < pointsPausedUntil;
}

/** ms until the points pause lifts (0 if not paused). */
export function pointsPauseRemainingMs() {
  return Math.max(0, pointsPausedUntil - Date.now());
}

/** Manually clear the pause (e.g. after a successful re-check found points). */
export function clearPointsPause() {
  pointsPausedUntil = 0;
}

// Parse a reset/replenish hint from CJ's envelope if present. CJ isn't
// guaranteed to send one; callers fall back to a short fixed re-check.
function parseResetMs(envelope) {
  const pi = envelope?.pointsInfo || {};
  // Try common shapes: resetTime (epoch ms/s), resetAt (ISO), nextResetSeconds.
  const cand = pi.resetTime ?? pi.resetAt ?? pi.nextReset ?? envelope?.resetTime;
  if (cand == null) return null;
  if (typeof cand === "number") {
    // Heuristic: seconds vs ms.
    const ms = cand < 1e12 ? cand * 1000 : cand;
    const delta = ms - Date.now();
    return delta > 0 && delta < 24 * 3600 * 1000 ? delta : null;
  }
  const t = Date.parse(cand);
  if (!Number.isNaN(t)) {
    const delta = t - Date.now();
    return delta > 0 && delta < 24 * 3600 * 1000 ? delta : null;
  }
  return null;
}

async function rawRequest(method, endpoint, body = null) {
  const token = await getValidAccessToken();
  const options = {
    method,
    headers: { "CJ-Access-Token": token, "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${CJ_CONFIG.BASE_URL}${endpoint}`, options);
  const result = await response.json();

  // Capture pointsInfo from EVERY response (success or failure) so the sync's
  // reserve check always reads the freshest value. pointsInfo is on the OUTER
  // envelope, which getCJProductsV2 never sees — this is the only place it's
  // visible.
  if (result && typeof result === "object" && result.pointsInfo) {
    lastPointsInfo = { ...result.pointsInfo, at: Date.now() };
  }

  if (!result.result) {
    const err = new Error(result.message || "CJ API Error");
    err.isQps = isQpsError(result.message);
    err.isPoints = isPointsError(result.message) || response.status === 429 && isPointsError(result.message);
    if (err.isPoints) {
      // Enter a pause. Use CJ's reset hint if given, else a short 2–3 min window
      // (caller re-checks and extends if points are still below reserve).
      const resetMs = parseResetMs(result);
      const pauseMs = resetMs ?? (150 * 1000); // ~2.5 min default
      pointsPausedUntil = Date.now() + pauseMs;
      console.warn(
        `[cj points] ✗ insufficient points — pausing CJ calls for ${(pauseMs / 1000 | 0)}s` +
        (lastPointsInfo ? ` (remaining: ${lastPointsInfo.remaining})` : "")
      );
    }
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