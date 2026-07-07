import { createClient } from "redis";

/**
 * Single shared Redis client. If Redis is unreachable the app keeps working —
 * every cache helper checks isReady() and silently falls back to MongoDB.
 */
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let client = null;
let ready = false;

export function getRedis() {
  return client;
}

export function isReady() {
  return Boolean(client) && ready;
}

export async function connectRedis() {
  if (client) return client;

  client = createClient({
    url: REDIS_URL,
    socket: {
      // Don't retry forever — after a few tries, give up and run without cache.
      reconnectStrategy: (retries) => {
        if (retries > 5) return false;
        return Math.min(retries * 200, 2000);
      },
    },
  });

  client.on("ready", () => {
    ready = true;
    console.log(`[cache] Redis connected → ${REDIS_URL}`);
  });
  client.on("end", () => { ready = false; });
  client.on("error", (err) => {
    // Only log the first error to avoid spam when Redis is down.
    if (ready) console.warn("[cache ERROR]", err.message);
    ready = false;
  });

  try {
    await client.connect();
  } catch (err) {
    ready = false;
    console.warn(`[cache] Redis unavailable (${err.message}). Running without cache.`);
  }
  return client;
}