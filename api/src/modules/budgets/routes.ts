import { Router } from "express";
import { requireAuth } from "../../auth/middleware.ts";
import { validate } from "../../middleware/validate.ts";
import { createBudgetSchema, updateBudgetSchema } from "./schema.ts";
import * as service from "./service.ts";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    res.json(await service.listBudgets(req.user!.sub, month));
  } catch (err) { next(err); }
});

router.post("/", validate(createBudgetSchema), async (req, res, next) => {
  try {
    res.status(201).json(await service.createBudget(req.user!.sub, req.body));
  } catch (err) { next(err); }
});

router.put("/:id", validate(updateBudgetSchema), async (req, res, next) => {
  try {
    res.json(await service.updateBudget(req.user!.sub, req.params.id, req.body));
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await service.deleteBudget(req.user!.sub, req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
