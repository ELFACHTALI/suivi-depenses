import { Queue, Worker } from "bullmq";
import { redis } from "../lib/redis.ts";
import { db } from "../db/index.ts";
import { users } from "../db/schema/index.ts";
import { isNull } from "drizzle-orm";
import { computeHealthScore } from "../modules/insights/service.ts";

export const HEALTH_SCORE_QUEUE = "health-score";

export const healthScoreQueue = new Queue(HEALTH_SCORE_QUEUE, {
  connection: redis,
  defaultJobOptions: { removeOnComplete: 50, removeOnFail: 20 },
});

export function startHealthScoreWorker() {
  const worker = new Worker(
    HEALTH_SCORE_QUEUE,
    async (job) => {
      const { userId } = job.data as { userId: string };
      const score = await computeHealthScore(userId);
      console.log(`[HealthScore] user=${userId} score=${score}`);
    },
    { connection: redis, concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[HealthScore] Job ${job?.id} échoué :`, err.message);
  });

  return worker;
}

// Enqueue tous les utilisateurs actifs (appelé par le scheduler chaque lundi)
export async function enqueueAllUsers() {
  const activeUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(isNull(users.deletedAt));

  for (const { id } of activeUsers) {
    await healthScoreQueue.add("compute", { userId: id });
  }

  console.log(`[HealthScore] ${activeUsers.length} jobs enqueued`);
}
