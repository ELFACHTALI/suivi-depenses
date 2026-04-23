import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";

export const bankConnectionStatusEnum = pgEnum("bank_connection_status", [
  "active",
  "expired",
  "error",
  "pending",
]);

// Stub Open Banking — structuré pour Tink/Powens mais non connecté en MVP (RG-17)
export const bankConnections = pgTable("bank_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  provider: varchar("provider", { length: 50 }).notNull(),
  externalId: varchar("external_id", { length: 255 }),
  // Tokens chiffrés AES-256 (jamais en clair en base)
  accessTokenEnc: text("access_token_enc"),
  refreshTokenEnc: text("refresh_token_enc"),
  status: bankConnectionStatusEnum("status").notNull().default("pending"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  // Consentement DSP2 expire ~90 jours après accord
  consentExpiresAt: timestamp("consent_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type BankConnection = typeof bankConnections.$inferSelect;
export type NewBankConnection = typeof bankConnections.$inferInsert;
