import { Queue, Worker } from "bullmq";
import { redis } from "../lib/redis.ts";
import { generateDueTransactions } from "../modules/recurring/service.ts";

export const RECURRING_QUEUE = "recurring-transactions";

export const recurringQueue = new Queue(RECURRING_QUEUE, {
  connection: redis,
  defaultJobOptions: { removeOnComplete: 20, removeOnFail: 10 },
});

export function startRecurringWorker() {
  const worker = new Worker(
    RECURRING_QUEUE,
    async () => {
      const count = await generateDueTransactions();
      console.log(`[Recurring] ${count} transaction(s) générée(s)`);
    },
    { connection: redis, concurrency: 1 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[Recurring] Job ${job?.id} échoué :`, err.message);
  });

  return worker;
}
