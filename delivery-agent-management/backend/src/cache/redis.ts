import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redis: Redis | null = null;
let redisAvailable = true;

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    });

    redis.on("error", (err: Error) => {
      if (redisAvailable) {
        console.error("[Redis] Connection error – falling back to DB:", err.message);
      }
      redisAvailable = false;
    });

    redis.on("connect", () => {
      if (!redisAvailable) {
        console.log("[Redis] Reconnected.");
      }
      redisAvailable = true;
    });
  }
  return redis;
}

export async function safeGet(key: string): Promise<string | null> {
  try {
    return await getRedisClient().get(key);
  } catch (err: unknown) {
    console.error("[Redis] GET failed, using DB:", (err as Error).message);
    return null;
  }
}

export async function safeSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    await getRedisClient().setex(key, ttlSeconds, value);
  } catch (err: unknown) {
    console.error("[Redis] SET failed:", (err as Error).message);
  }
}

export async function safeDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) await getRedisClient().del(...keys);
  } catch (err: unknown) {
    console.error("[Redis] DEL failed:", (err as Error).message);
  }
}

export async function safeIncr(key: string): Promise<void> {
  try {
    await getRedisClient().incr(key);
  } catch (err: unknown) {
    console.error("[Redis] INCR failed:", (err as Error).message);
  }
}

export async function safeGet_number(key: string): Promise<number> {
  try {
    const val = await getRedisClient().get(key);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}
