import {
  pgTable,
  uuid,
  varchar,
  bigint,
  numeric,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";

export const debts = pgTable("debts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  creditor: varchar("creditor", { length: 100 }).notNull(),
  // Montants en centimes
  totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
  remainingAmount: bigint("remaining_amount", { mode: "number" }).notNull(),
  monthlyPayment: bigint("monthly_payment", { mode: "number" }).notNull(),
  // Taux annuel en pourcentage (ex: 5.5 pour 5,5%)
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("MAD"),
  startDate: date("start_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type Debt = typeof debts.$inferSelect;
export type NewDebt = typeof debts.$inferInsert;
