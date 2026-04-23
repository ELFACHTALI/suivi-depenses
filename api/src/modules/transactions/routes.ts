import { Router } from "express";
import { requireAuth } from "../../auth/middleware.ts";
import { validate } from "../../middleware/validate.ts";
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsSchema,
} from "./schema.ts";
import * as service from "./service.ts";
import { z } from "zod";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const query = listTransactionsSchema.parse(req.query);
    res.json(await service.listTransactions(req.user!.sub, query));
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Paramètres invalides", details: err.flatten().fieldErrors });
      return;
    }
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    res.json(await service.getTransaction(req.user!.sub, req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(createTransactionSchema), async (req, res, next) => {
  try {
    res.status(201).json(await service.createTransaction(req.user!.sub, req.body));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", validate(updateTransactionSchema), async (req, res, next) => {
  try {
    res.json(await service.updateTransaction(req.user!.sub, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await service.deleteTransaction(req.user!.sub, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
