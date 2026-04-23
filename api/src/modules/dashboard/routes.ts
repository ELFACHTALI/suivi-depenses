import { Router } from "express";
import { requireAuth } from "../../auth/middleware.ts";
import { getDashboard } from "./service.ts";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    res.json(await getDashboard(req.user!.sub, month));
  } catch (err) {
    next(err);
  }
});

export default router;
