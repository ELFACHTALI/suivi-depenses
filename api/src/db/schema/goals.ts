import {
  pgTable,
  uuid,
  varchar,
  bigint,
  text,
  date,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";

export const goalStatusEnum = pgEnum("goal_status", [
  "in_progress",
  "achieved",
  "archived",
]);

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  // Objectif cible en centimes
  targetAmount: bigint("target_amount", { mode: "number" }).notNull(),
  // Montant accumulé en centimes (mis à jour à chaque contribution)
  currentAmount: bigint("current_amount", { mode: "number" })
    .notNull()
    .default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("MAD"),
  targetDate: date("target_date"),
  status: goalStatusEnum("status").notNull().default("in_progress"),
  emoji: varchar("emoji", { length: 10 }).notNull().default("🎯"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
