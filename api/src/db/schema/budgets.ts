import {
  pgTable,
  uuid,
  bigint,
  boolean,
  date,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";
import { categories } from "./categories.ts";

export const budgetPeriodEnum = pgEnum("budget_period", [
  "monthly",
  "annual",
]);

export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  period: budgetPeriodEnum("period").notNull().default("monthly"),
  // Plafond en centimes
  amount: bigint("amount", { mode: "number" }).notNull(),
  startDate: date("start_date").notNull(),
  // Flags pour éviter les doublons d'alertes (RG-08)
  alert80Sent: boolean("alert_80_sent").notNull().default(false),
  alert100Sent: boolean("alert_100_sent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
