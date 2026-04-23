import {
  pgTable,
  uuid,
  integer,
  numeric,
  jsonb,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";

export const insights = pgTable("insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  // Date du lundi de la semaine analysée (RG-13)
  weekStart: date("week_start").notNull(),
  // Score global 0–100
  score: integer("score").notNull(),
  // Sous-métriques (chacune contribue au score global)
  savingsRate: numeric("savings_rate", { precision: 5, scale: 2 }),
  budgetRespect: numeric("budget_respect", { precision: 5, scale: 2 }),
  entryRegularity: numeric("entry_regularity", { precision: 5, scale: 2 }),
  debtRatio: numeric("debt_ratio", { precision: 5, scale: 2 }),
  // Conseils personnalisés générés par le moteur de règles
  tips: jsonb("tips").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Insight = typeof insights.$inferSelect;
export type NewInsight = typeof insights.$inferInsert;
