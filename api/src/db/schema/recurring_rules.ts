import {
  pgTable,
  uuid,
  varchar,
  bigint,
  date,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";
import { accounts } from "./accounts.ts";
import { categories } from "./categories.ts";
import { transactionTypeEnum } from "./transactions.ts";

export const recurringFrequencyEnum = pgEnum("recurring_frequency", [
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

export const recurringRules = pgTable("recurring_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  title: varchar("title", { length: 200 }).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("MAD"),
  type: transactionTypeEnum("type").notNull(),
  frequency: recurringFrequencyEnum("frequency").notNull(),
  nextDate: date("next_date").notNull(),
  endDate: date("end_date"),
  // Dernière fois que le job a généré une transaction
  lastGeneratedAt: timestamp("last_generated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type RecurringRule = typeof recurringRules.$inferSelect;
export type NewRecurringRule = typeof recurringRules.$inferInsert;
