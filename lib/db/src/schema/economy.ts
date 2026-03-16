import { pgTable, text, integer, boolean, uuid, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const transactionsTable = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  planId: text("plan_id"),
  amountKsh: integer("amount_ksh"),
  coins: integer("coins"),
  phone: text("phone"),
  checkoutRequestId: text("checkout_request_id"),
  status: text("status").default("pending").notNull(),
  description: text("description"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Transaction = typeof transactionsTable.$inferSelect;

export const coinPackagesTable = pgTable("coin_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  description: text("description"),
  priceKsh: integer("price_ksh"),
  coins: integer("coins"),
  bonusCoins: integer("bonus_coins").default(0).notNull(),
  badge: text("badge"),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CoinPackage = typeof coinPackagesTable.$inferSelect;

export const airdropsTable = pgTable("airdrops", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  description: text("description"),
  coins: integer("coins"),
  target: text("target").default("all").notNull(),
  condition: text("condition"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  maxClaims: integer("max_claims"),
  claimCount: integer("claim_count").default(0).notNull(),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Airdrop = typeof airdropsTable.$inferSelect;

export const airdropClaimsTable = pgTable("airdrop_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  airdropId: uuid("airdrop_id").references(() => airdropsTable.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  claimedAt: timestamp("claimed_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AirdropClaim = typeof airdropClaimsTable.$inferSelect;

export const referralsTable = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerId: uuid("referrer_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  refereeId: uuid("referee_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  coinsAwarded: integer("coins_awarded"),
  milestone: text("milestone"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Referral = typeof referralsTable.$inferSelect;

export const referralConfigTable = pgTable("referral_config", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
});

export type ReferralConfig = typeof referralConfigTable.$inferSelect;

export const userBadgesTable = pgTable("user_badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  badgeId: text("badge_id"),
  awardedAt: timestamp("awarded_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserBadge = typeof userBadgesTable.$inferSelect;

export const promoCodesTable = pgTable("promo_codes", {
  code: text("code").primaryKey(),
  coins: integer("coins"),
  discountPercent: integer("discount_percent").default(0).notNull(),
  maxUses: integer("max_uses"),
  uses: integer("uses").default(0).notNull(),
  minRole: text("min_role").default("user").notNull(),
  onePerUser: boolean("one_per_user").default(true).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PromoCode = typeof promoCodesTable.$inferSelect;

export const promoUsesTable = pgTable("promo_uses", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code"),
  userId: uuid("user_id"),
  usedAt: timestamp("used_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PromoUse = typeof promoUsesTable.$inferSelect;

export const coinTransfersTable = pgTable("coin_transfers", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromUserId: uuid("from_user_id"),
  toUserId: uuid("to_user_id"),
  coins: integer("coins"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CoinTransfer = typeof coinTransfersTable.$inferSelect;
