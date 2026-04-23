import {
  pgTable,
  uuid,
  varchar,
  bigint,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";

export const accountTypeEnum = pgEnum("account_type", [
  "cash",
  "card",
  "savings",
  "credit",
]);

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  type: accountTypeEnum("type").notNull(),
  // Solde initial en centimes (ex: 1000 MAD = 100000)
  initialBalance: bigint("initial_balance", { mode: "number" })
    .notNull()
    .default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("MAD"),
  color: varchar("color", { length: 7 }).notNull().default("#6366f1"),
  icon: varchar("icon", { length: 50 }).notNull().default("wallet"),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
