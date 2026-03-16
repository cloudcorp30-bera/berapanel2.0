import { pgTable, text, integer, boolean, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").default("user").notNull(),
  coins: integer("coins").default(0).notNull(),
  totalCoinsEarned: integer("total_coins_earned").default(0).notNull(),
  banned: boolean("banned").default(false).notNull(),
  banReason: text("ban_reason"),
  banExpiresAt: timestamp("ban_expires_at", { withTimezone: true }),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  referralCode: text("referral_code").unique(),
  referredBy: uuid("referred_by"),
  telegramChatId: text("telegram_chat_id"),
  telegramEnabled: boolean("telegram_enabled").default(false).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  twoFaSecret: text("two_fa_secret"),
  twoFaEnabled: boolean("two_fa_enabled").default(false).notNull(),
  lastLogin: timestamp("last_login", { withTimezone: true }),
  loginCount: integer("login_count").default(0).notNull(),
  streakDays: integer("streak_days").default(0).notNull(),
  lastStreakClaim: timestamp("last_streak_claim", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const sessionsTable = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  refreshToken: text("refresh_token").unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Session = typeof sessionsTable.$inferSelect;
