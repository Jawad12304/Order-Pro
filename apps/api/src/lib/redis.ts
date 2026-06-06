import Redis from "ioredis";

const globalForRedis = global as unknown as { redis: Redis };
const redisUrl = process.env.REDIS_URL || "";

export const redis =
  globalForRedis.redis ||
  new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
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

  return fetcher();
}
