import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { publicLimiter } from "./middleware/rateLimiter.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import router from "./router.ts";
import { db } from "./db/index.ts";
import { seedDefaultCategories } from "./modules/categories/seed.ts";
import { startHealthScoreWorker } from "./jobs/healthScore.ts";
import { startRecurringWorker } from "./jobs/recurringTransactions.ts";
import { startScheduler } from "./jobs/scheduler.ts";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3000", 10);

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(publicLimiter);

app.use("/api/v1", router);
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`API Fintrack démarrée sur http://localhost:${PORT}`);

  // Migrations automatiques au démarrage
  await migrate(db, { migrationsFolder: "./drizzle" }).catch((e) =>
    console.warn("[Migrate] Erreur :", e.message)
  );
  console.log("[Migrate] Migrations appliquées.");

  await seedDefaultCategories().catch((e) =>
    console.warn("[Seed] Catégories non insérées :", e.message)
  );

  // Démarrage des workers BullMQ
  startHealthScoreWorker();
  startRecurringWorker();
  await startScheduler().catch((e) =>
    console.warn("[Scheduler] Erreur démarrage :", e.message)
  );
});
