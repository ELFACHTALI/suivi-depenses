import { Router } from "express";
import { requireAuth } from "../../auth/middleware.ts";
import { validate } from "../../middleware/validate.ts";
import { createGoalSchema, updateGoalSchema, contributeSchema } from "./schema.ts";
import * as service from "./service.ts";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try { res.json(await service.listGoals(req.user!.sub)); }
  catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try { res.json(await service.getGoal(req.user!.sub, req.params.id)); }
  catch (err) { next(err); }
});

router.post("/", validate(createGoalSchema), async (req, res, next) => {
  try {
    res.status(201).json(await service.createGoal(req.user!.sub, req.body));
  } catch (err) { next(err); }
});

router.put("/:id", validate(updateGoalSchema), async (req, res, next) => {
  try {
    res.json(await service.updateGoal(req.user!.sub, req.params.id, req.body));
  } catch (err) { next(err); }
});

router.post("/:id/contribute", validate(contributeSchema), async (req, res, next) => {
  try {
    res.json(await service.contributeToGoal(req.user!.sub, req.params.id, req.body.amount));
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await service.deleteGoal(req.user!.sub, req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
