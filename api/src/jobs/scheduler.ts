import { healthScoreQueue, enqueueAllUsers } from "./healthScore.ts";
import { enqueueRecurring } from "./recurringTransactions.ts";

// Crons BullMQ — format : répétition automatique via repeat
export async function startScheduler() {
  // Score santé : chaque lundi à 02h00 (RG-13)
  await healthScoreQueue.add(
    "weekly-trigger",
    {},
    {
      repeat: { pattern: "0 2 * * 1" }, // lundi 02:00
      jobId: "health-score-weekly",
    }
  );

  // Génération récurrences : chaque jour à 06h00
  const { recurringQueue } = await import("./recurringTransactions.ts");
  await recurringQueue.add(
    "daily-trigger",
    {},
    {
      repeat: { pattern: "0 6 * * *" },
      jobId: "recurring-daily",
    }
  );

  console.log("[Scheduler] Crons démarrés (health-score lundi 02h, récurrences 06h quotidien)");
}
