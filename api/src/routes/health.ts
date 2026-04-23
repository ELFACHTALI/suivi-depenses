import { Router } from "express";
import Redis from "ioredis";
import { checkDbConnection } from "../db/index.ts";

const router = Router();

router.get("/", async (_req, res) => {
  const dbOk = await checkDbConnection();

  let redisOk = false;
  try {
    const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      connectTimeout: 3000,
      lazyConnect: true,
    });
    await redis.connect();
    await redis.ping();
    await redis.quit();
    redisOk = true;
  } catch {
    redisOk = false;
  }

  const status = dbOk && redisOk ? "ok" : "degraded";

  res.status(status === "ok" ? 200 : 503).json({
    status,
    db: dbOk ? "ok" : "error",
    redis: redisOk ? "ok" : "error",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

export default router;
