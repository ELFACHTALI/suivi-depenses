import { Router } from "express";
import { requireAuth } from "../../auth/middleware.ts";
import { validate } from "../../middleware/validate.ts";
import { createRecurringSchema, updateRecurringSchema } from "./schema.ts";
import * as service from "./service.ts";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try { res.json(await service.listRecurring(req.user!.sub)); }
  catch (err) { next(err); }
});

router.post("/", validate(createRecurringSchema), async (req, res, next) => {
  try {
    res.status(201).json(await service.createRecurring(req.user!.sub, req.body));
  } catch (err) { next(err); }
});

router.put("/:id", validate(updateRecurringSchema), async (req, res, next) => {
  try {
    res.json(await service.updateRecurring(req.user!.sub, req.params.id, req.body));
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await service.deleteRecurring(req.user!.sub, req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
