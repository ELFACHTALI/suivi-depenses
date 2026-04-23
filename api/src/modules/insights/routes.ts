import { Router } from "express";
import { requireAuth, requirePremium } from "../../auth/middleware.ts";
import { getLatestInsight, detectAnomalies, detectSubscriptions } from "./service.ts";

const router = Router();
router.use(requireAuth, requirePremium); // gate Premium

router.get("/", async (req, res, next) => {
  try {
    const [insight, anomalies, subscriptions] = await Promise.all([
      getLatestInsight(req.user!.sub),
      detectAnomalies(req.user!.sub),
      detectSubscriptions(req.user!.sub),
    ]);
    res.json({ insight, anomalies, subscriptions });
  } catch (err) {
    next(err);
  }
});

export default router;
