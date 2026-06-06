import Redis from "ioredis";

// Singleton redis instance
const globalForRedis = global as unknown as { redis: Redis };

// Provide a safe fallback if no Redis URL is provided, so the app doesn't crash
// In a real production setup, we'd ensure REDIS_URL exists.
const redisUrl = process.env.REDIS_URL || "";

// We use lazy connection strategy so if URL is empty, it doesn't instantly throw
export const redis =
  globalForRedis.redis ||
  new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      // Don't retry indefinitely if there's no server
      if (times > 3) return null;
      return Math.min(times * 50, 2000);
    },
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

// Helper function to safely get/set cache
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    // If we successfully connected
    if (redis.status === "ready" || redis.status === "connecting") {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      const freshData = await fetcher();
      await redis.setex(key, ttlSeconds, JSON.stringify(freshData));
      return freshData;
    }
  } catch (err) {
    console.warn("Redis cache failed, bypassing...", err);
  }

  // Fallback to direct fetch if Redis is down/unavailable
  return fetcher();
}
