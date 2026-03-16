import { pgTable, text, boolean, uuid, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  title: text("title"),
  message: text("message"),
  type: text("type").default("info").notNull(),
  category: text("category").default("general").notNull(),
  actionUrl: text("action_url"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Notification = typeof notificationsTable.$inferSelect;

export const apiKeysTable = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  key: text("key").unique().notNull(),
  name: text("name"),
  permissions: jsonb("permissions").default(["read"]).$type<string[]>(),
  rateLimit: integer("rate_limit").default(100).notNull(),
  requestCount: integer("request_count").default(0).notNull(),
  lastUsed: timestamp("last_used", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  ipWhitelist: text("ip_whitelist").array().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ApiKey = typeof apiKeysTable.$inferSelect;

export const botTemplatesTable = pgTable("bot_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  icon: text("icon"),
  repoUrl: text("repo_url"),
  branch: text("branch").default("main").notNull(),
  startCommand: text("start_command"),
  installCommand: text("install_command").default("npm install").notNull(),
  runtime: text("runtime").default("node").notNull(),
  requiredEnvVars: jsonb("required_env_vars").default([]).$type<Array<{key: string; label: string; description?: string; required?: boolean}>>(),
  tags: text("tags").array().default([]),
  previewImage: text("preview_image"),
  readme: text("readme"),
  coinCost: integer("coin_cost").default(0).notNull(),
  deployCount: integer("deploy_count").default(0).notNull(),
  ratingSum: integer("rating_sum").default(0).notNull(),
  ratingCount: integer("rating_count").default(0).notNull(),
  featured: boolean("featured").default(false).notNull(),
  verified: boolean("verified").default(false).notNull(),
  addedBy: uuid("added_by").references(() => usersTable.id),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type BotTemplate = typeof botTemplatesTable.$inferSelect;

export const botReviewsTable = pgTable("bot_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id").references(() => botTemplatesTable.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  rating: integer("rating"),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type BotReview = typeof botReviewsTable.$inferSelect;

export const supportTicketsTable = pgTable("support_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  assignedTo: uuid("assigned_to").references(() => usersTable.id),
  subject: text("subject"),
  category: text("category").default("general").notNull(),
  priority: text("priority").default("normal").notNull(),
  status: text("status").default("open").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export type SupportTicket = typeof supportTicketsTable.$inferSelect;

export const supportMessagesTable = pgTable("support_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").references(() => supportTicketsTable.id, { onDelete: "cascade" }).notNull(),
  senderId: uuid("sender_id"),
  senderRole: text("sender_role"),
  message: text("message"),
  attachments: jsonb("attachments").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SupportMessage = typeof supportMessagesTable.$inferSelect;

export const announcementsTable = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  body: text("body"),
  type: text("type").default("info").notNull(),
  pinned: boolean("pinned").default(false).notNull(),
  targetRole: text("target_role").default("all").notNull(),
  published: boolean("published").default(true).notNull(),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Announcement = typeof announcementsTable.$inferSelect;

export const auditLogTable = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id"),
  actorUsername: text("actor_username"),
  action: text("action"),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  detail: jsonb("detail"),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AuditLog = typeof auditLogTable.$inferSelect;

export const platformSettingsTable = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PlatformSetting = typeof platformSettingsTable.$inferSelect;

export const adminNotesTable = pgTable("admin_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content"),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const badgeRequestsTable = pgTable("badge_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  reason: text("reason"),
  status: text("status").default("pending").notNull(),
  adminNote: text("admin_note"),
  reviewedBy: uuid("reviewed_by").references(() => usersTable.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type BadgeRequest = typeof badgeRequestsTable.$inferSelect;

export const customDomainsTable = pgTable("custom_domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  domain: text("domain").unique(),
  verified: boolean("verified").default(false).notNull(),
  sslEnabled: boolean("ssl_enabled").default(false).notNull(),
  cnameTarget: text("cname_target"),
  txtRecord: text("txt_record"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
