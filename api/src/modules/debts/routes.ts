import { Router } from "express";
import { requireAuth } from "../../auth/middleware.ts";
import { validate } from "../../middleware/validate.ts";
import { createDebtSchema, updateDebtSchema } from "./schema.ts";
import * as service from "./service.ts";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try { res.json(await service.listDebts(req.user!.sub)); }
  catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try { res.json(await service.getDebt(req.user!.sub, req.params.id)); }
  catch (err) { next(err); }
});

router.get("/:id/schedule", async (req, res, next) => {
  try {
    res.json(await service.getAmortizationSchedule(req.user!.sub, req.params.id));
  } catch (err) { next(err); }
});

router.post("/", validate(createDebtSchema), async (req, res, next) => {
  try {
    res.status(201).json(await service.createDebt(req.user!.sub, req.body));
  } catch (err) { next(err); }
});

router.put("/:id", validate(updateDebtSchema), async (req, res, next) => {
  try {
    res.json(await service.updateDebt(req.user!.sub, req.params.id, req.body));
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await service.deleteDebt(req.user!.sub, req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
