import { pgTable, text, integer, boolean, uuid, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const projectsTable = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  repoUrl: text("repo_url"),
  branch: text("branch").default("main").notNull(),
  startCommand: text("start_command").default("node index.js").notNull(),
  buildCommand: text("build_command"),
  installCommand: text("install_command").default("npm install").notNull(),
  runtime: text("runtime").default("node").notNull(),
  envVars: jsonb("env_vars").default({}).$type<Record<string, string>>(),
  secrets: jsonb("secrets").default({}).$type<Record<string, string>>(),
  status: text("status").default("stopped").notNull(),
  port: integer("port"),
  liveUrl: text("live_url"),
  customDomain: text("custom_domain"),
  customDomainVerified: boolean("custom_domain_verified").default(false).notNull(),
  deploySource: text("deploy_source").default("github").notNull(),
  zipFilename: text("zip_filename"),
  webhookSecret: text("webhook_secret"),
  healthCheckUrl: text("health_check_url"),
  healthCheckInterval: integer("health_check_interval").default(60).notNull(),
  autoRestart: boolean("auto_restart").default(true).notNull(),
  sleepEnabled: boolean("sleep_enabled").default(false).notNull(),
  sleepAfterMinutes: integer("sleep_after_minutes").default(30).notNull(),
  lastRequestAt: timestamp("last_request_at", { withTimezone: true }),
  memoryLimitMb: integer("memory_limit_mb").default(512).notNull(),
  cpuLimitPercent: integer("cpu_limit_percent").default(80).notNull(),
  lastDeployedAt: timestamp("last_deployed_at", { withTimezone: true }),
  lastDeployedBy: uuid("last_deployed_by"),
  deployCount: integer("deploy_count").default(0).notNull(),
  uptimeSeconds: integer("uptime_seconds").default(0).notNull(),
  crashCount: integer("crash_count").default(0).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  tags: text("tags").array().default([]),
  pinned: boolean("pinned").default(false).notNull(),
  coinCostPerHour: numeric("coin_cost_per_hour").default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;

export const deployHistoryTable = pgTable("deploy_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projectsTable.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id"),
  source: text("source"),
  commitHash: text("commit_hash"),
  commitMessage: text("commit_message"),
  status: text("status").default("pending").notNull(),
  buildLog: text("build_log"),
  durationSeconds: integer("duration_seconds"),
  snapshotPath: text("snapshot_path"),
  deployedAt: timestamp("deployed_at", { withTimezone: true }).defaultNow().notNull(),
});

export type DeployHistory = typeof deployHistoryTable.$inferSelect;

export const projectMetricsTable = pgTable("project_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projectsTable.id, { onDelete: "cascade" }).notNull(),
  cpuPercent: numeric("cpu_percent"),
  memoryMb: numeric("memory_mb"),
  requestCount: integer("request_count").default(0).notNull(),
  errorCount: integer("error_count").default(0).notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ProjectMetric = typeof projectMetricsTable.$inferSelect;

export const cronJobsTable = pgTable("cron_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projectsTable.id, { onDelete: "cascade" }).notNull(),
  name: text("name"),
  schedule: text("schedule"),
  command: text("command"),
  enabled: boolean("enabled").default(true).notNull(),
  lastRun: timestamp("last_run", { withTimezone: true }),
  nextRun: timestamp("next_run", { withTimezone: true }),
  runCount: integer("run_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CronJob = typeof cronJobsTable.$inferSelect;

export const projectCollaboratorsTable = pgTable("project_collaborators", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projectsTable.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  role: text("role").default("viewer").notNull(),
  invitedBy: uuid("invited_by"),
  accepted: boolean("accepted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ProjectCollaborator = typeof projectCollaboratorsTable.$inferSelect;
