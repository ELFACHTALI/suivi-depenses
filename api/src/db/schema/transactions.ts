import {
  pgTable,
  uuid,
  varchar,
  bigint,
  numeric,
  text,
  date,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";
import { accounts } from "./accounts.ts";
import { categories } from "./categories.ts";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "expense",
  "income",
  "transfer",
]);

export const transactions = pgTable("transactions", {
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
  // Montant en centimes (RG-05 : jamais de float financier)
  amount: bigint("amount", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("MAD"),
  // Taux de change figé à la date de saisie (RG-05)
  fxRate: numeric("fx_rate", { precision: 18, scale: 8 }).notNull().default("1"),

  type: transactionTypeEnum("type").notNull(),
  // Lien entre les deux transactions d'un virement (RG-02)
  transferId: uuid("transfer_id"),

  note: text("note"),
  date: date("date").notNull(),
  receiptUrl: text("receipt_url"),
  // Marquage fiscal (freelances — Karim persona)
  fiscalMarker: boolean("fiscal_marker").notNull().default(false),

  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringRuleId: uuid("recurring_rule_id"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
