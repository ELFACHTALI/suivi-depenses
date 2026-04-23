import { Router } from "express";
import { requireAuth } from "../../auth/middleware.ts";
import { validate } from "../../middleware/validate.ts";
import { createCategorySchema, updateCategorySchema } from "./schema.ts";
import * as service from "./service.ts";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    res.json(await service.listCategories(req.user!.sub));
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(createCategorySchema), async (req, res, next) => {
  try {
    res.status(201).json(await service.createCategory(req.user!.sub, req.body));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", validate(updateCategorySchema), async (req, res, next) => {
  try {
    res.json(await service.updateCategory(req.user!.sub, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await service.deleteCategory(req.user!.sub, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
