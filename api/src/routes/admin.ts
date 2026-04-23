import { Router } from "express";
import { requireAuth } from "../auth/middleware.ts";
import { enqueueAllUsers } from "../jobs/healthScore.ts";
import { generateDueTransactions } from "../modules/recurring/service.ts";

const router = Router();
router.use(requireAuth);

// POST /api/v1/admin/jobs/healthScore — force le calcul du score santé
router.post("/jobs/healthScore", async (_req, res, next) => {
  try {
    await enqueueAllUsers();
    res.json({ message: "Jobs health-score enqueued" });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/jobs/recurring — force la génération des récurrences dues
router.post("/jobs/recurring", async (_req, res, next) => {
  try {
    const count = await generateDueTransactions();
    res.json({ message: `${count} transaction(s) générée(s)` });
  } catch (err) {
    next(err);
  }
});

export default router;
