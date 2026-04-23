import { Router } from "express";
import { authLimiter } from "./middleware/rateLimiter.ts";
import healthRouter from "./routes/health.ts";
import authRouter from "./auth/routes.ts";
import accountsRouter from "./modules/accounts/routes.ts";
import categoriesRouter from "./modules/categories/routes.ts";
import transactionsRouter from "./modules/transactions/routes.ts";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/accounts", authLimiter, accountsRouter);
router.use("/categories", authLimiter, categoriesRouter);
router.use("/transactions", authLimiter, transactionsRouter);

export default router;
