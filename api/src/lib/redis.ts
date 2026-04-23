import Redis from "ioredis";

export const redis = new Redis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
  {
    lazyConnect: false,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  }
);

redis.on("error", (err) => {
  console.error("[Redis] Erreur de connexion :", err.message);
});
