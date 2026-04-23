import { Router } from "express";
import { requireAuth } from "../../auth/middleware.ts";
import { validate } from "../../middleware/validate.ts";
import { createAccountSchema, updateAccountSchema } from "./schema.ts";
import * as service from "./service.ts";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    res.json(await service.listAccounts(req.user!.sub));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    res.json(await service.getAccount(req.user!.sub, req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(createAccountSchema), async (req, res, next) => {
  try {
    res.status(201).json(await service.createAccount(req.user!.sub, req.body));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", validate(updateAccountSchema), async (req, res, next) => {
  try {
    res.json(await service.updateAccount(req.user!.sub, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await service.deleteAccount(req.user!.sub, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
