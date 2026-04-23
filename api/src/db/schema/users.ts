import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const planTypeEnum = pgEnum("plan_type", ["free", "premium"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  planType: planTypeEnum("plan_type").notNull().default("free"),
  referenceCurrency: varchar("reference_currency", { length: 3 })
    .notNull()
    .default("MAD"),
  timezone: varchar("timezone", { length: 50 })
    .notNull()
    .default("Africa/Casablanca"),
  language: varchar("language", { length: 5 }).notNull().default("fr"),
  // 2FA / sécurité
  totpSecret: text("totp_secret"),
  isTotpEnabled: boolean("is_totp_enabled").notNull().default(false),
  // Soft-delete + audit
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
