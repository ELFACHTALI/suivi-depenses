import { Router } from "express";
import { authLimiter } from "./middleware/rateLimiter.ts";
import healthRouter from "./routes/health.ts";
import authRouter from "./auth/routes.ts";
import accountsRouter from "./modules/accounts/routes.ts";
import categoriesRouter from "./modules/categories/routes.ts";
import transactionsRouter from "./modules/transactions/routes.ts";
import budgetsRouter from "./modules/budgets/routes.ts";
import goalsRouter from "./modules/goals/routes.ts";
import debtsRouter from "./modules/debts/routes.ts";
import dashboardRouter from "./modules/dashboard/routes.ts";
import insightsRouter from "./modules/insights/routes.ts";
import recurringRouter from "./modules/recurring/routes.ts";
import adminRouter from "./routes/admin.ts";

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/dashboard", authLimiter, dashboardRouter);
router.use("/accounts", authLimiter, accountsRouter);
router.use("/categories", authLimiter, categoriesRouter);
router.use("/transactions", authLimiter, transactionsRouter);
router.use("/budgets", authLimiter, budgetsRouter);
router.use("/goals", authLimiter, goalsRouter);
router.use("/debts", authLimiter, debtsRouter);
router.use("/insights", authLimiter, insightsRouter);
router.use("/recurring", authLimiter, recurringRouter);

// Endpoints dev pour déclencher les jobs manuellement
if (process.env.NODE_ENV !== "production") {
  router.use("/admin", adminRouter);
}

export default router;
