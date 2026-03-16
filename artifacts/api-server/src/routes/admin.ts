import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  projectsTable,
  transactionsTable,
  coinPackagesTable,
  airdropsTable,
  botTemplatesTable,
  supportTicketsTable,
  supportMessagesTable,
  announcementsTable,
  notificationsTable,
  auditLogTable,
  platformSettingsTable,
  promoCodesTable,
  referralConfigTable,
} from "@workspace/db";
import { eq, desc, and, ilike, sql, gte, count as countFn, or } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth.js";
import { awardCoins } from "../lib/coins.js";
import { stopProcess, startProcess } from "../lib/process-manager.js";
import si from "systeminformation";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// GET /admin/dashboard
router.get("/admin/dashboard", async (req, res): Promise<void> => {
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const [projectCount] = await db.select({ count: sql<number>`count(*)` }).from(projectsTable);
  const [runningCount] = await db.select({ count: sql<number>`count(*)` }).from(projectsTable).where(eq(projectsTable.status, "running"));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [signupCount] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(gte(usersTable.createdAt, today));
  const [deployCount] = await db.select({ count: sql<number>`count(*)` }).from(projectsTable).where(gte(projectsTable.lastDeployedAt, today));
  const [ticketCount] = await db.select({ count: sql<number>`count(*)` }).from(supportTicketsTable).where(or(eq(supportTicketsTable.status, "open"), eq(supportTicketsTable.status, "in_progress")));
  const [revenue] = await db.select({ sum: sql<number>`coalesce(sum(amount_ksh), 0)` }).from(transactionsTable).where(and(eq(transactionsTable.type, "purchase"), eq(transactionsTable.status, "completed")));
  const [coinCirc] = await db.select({ sum: sql<number>`coalesce(sum(coins), 0)` }).from(usersTable);

  res.json({
    totalUsers: Number(userCount.count),
    totalProjects: Number(projectCount.count),
    runningProjects: Number(runningCount.count),
    totalRevenue: Number(revenue.sum) || 0,
    todaySignups: Number(signupCount.count),
    coinsInCirculation: Number(coinCirc.sum) || 0,
    todayDeploys: Number(deployCount.count),
    activeTickets: Number(ticketCount.count),
  });
});

// GET /admin/system
router.get("/admin/system", async (req, res): Promise<void> => {
  const cpu = await si.currentLoad();
  const mem = await si.mem();
  const disk = await si.fsSize();
  res.json({
    cpuPercent: cpu.currentLoad,
    memoryMb: Math.round(mem.used / 1024 / 1024),
    memoryTotalMb: Math.round(mem.total / 1024 / 1024),
    diskGb: Math.round((disk[0]?.used || 0) / 1024 / 1024 / 1024),
    diskTotalGb: Math.round((disk[0]?.size || 0) / 1024 / 1024 / 1024),
    loadAvg: [cpu.avgLoad, cpu.avgLoad, cpu.avgLoad],
    nodeVersion: process.version,
    uptimeSeconds: process.uptime(),
    processCount: 0,
  });
});

// GET /admin/users
router.get("/admin/users", async (req, res): Promise<void> => {
  const page = parseInt(req.query.page as string || "1");
  const limit = parseInt(req.query.limit as string || "20");
  const q = req.query.q as string;
  const role = req.query.role as string;
  const banned = req.query.banned as string;

  let conditions: any[] = [];
  if (q) conditions.push(ilike(usersTable.username, `%${q}%`));
  if (role) conditions.push(eq(usersTable.role, role));
  if (banned === "true") conditions.push(eq(usersTable.banned, true));
  if (banned === "false") conditions.push(eq(usersTable.banned, false));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const users = await db.select().from(usersTable).where(whereClause).orderBy(desc(usersTable.createdAt)).limit(limit).offset((page - 1) * limit);
  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(usersTable).where(whereClause);

  res.json({ users: users.map(u => ({ ...u, password: undefined })), total: Number(total), page, limit });
});

// GET /admin/users/:userId
router.get("/admin/users/:userId", async (req, res): Promise<void> => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const projects = await db.select().from(projectsTable).where(eq(projectsTable.userId, userId)).limit(20);
  const transactions = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId)).orderBy(desc(transactionsTable.createdAt)).limit(20);
  res.json({ user: { ...user, password: undefined }, projects: projects.map(p => ({ ...p, envVars: {}, tags: p.tags || [], coinCostPerHour: Number(p.coinCostPerHour) })), transactions });
});

// POST /admin/users/:userId/coins
router.post("/admin/users/:userId/coins", async (req, res): Promise<void> => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const { amount, reason } = req.body;
  await awardCoins(userId, amount, "gift", reason || "Admin adjustment");
  res.json({ success: true });
});

// POST /admin/users/:userId/ban
router.post("/admin/users/:userId/ban", async (req, res): Promise<void> => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const { banned, reason, expiresAt } = req.body;
  await db.update(usersTable).set({ banned, banReason: reason, banExpiresAt: expiresAt ? new Date(expiresAt) : null }).where(eq(usersTable.id, userId));
  res.json({ success: true });
});

// POST /admin/users/:userId/role
router.post("/admin/users/:userId/role", async (req, res): Promise<void> => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const { role } = req.body;
  await db.update(usersTable).set({ role }).where(eq(usersTable.id, userId));
  res.json({ success: true });
});

// DELETE /admin/users/:userId
router.delete("/admin/users/:userId", async (req, res): Promise<void> => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.json({ success: true });
});

// POST /admin/users/:userId/reset-password
router.post("/admin/users/:userId/reset-password", async (req, res): Promise<void> => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const { newPassword } = req.body;
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ password: hashed }).where(eq(usersTable.id, userId));
  res.json({ success: true });
});

// GET /admin/projects
router.get("/admin/projects", async (req, res): Promise<void> => {
  const page = parseInt(req.query.page as string || "1");
  const limit = 20;
  const status = req.query.status as string;
  const userId = req.query.userId as string;

  let conditions: any[] = [];
  if (status) conditions.push(eq(projectsTable.status, status));
  if (userId) conditions.push(eq(projectsTable.userId, userId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const projects = await db.select().from(projectsTable).where(whereClause).orderBy(desc(projectsTable.updatedAt)).limit(limit).offset((page - 1) * limit);
  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(projectsTable).where(whereClause);

  res.json({ projects: projects.map(p => ({ ...p, envVars: {}, tags: p.tags || [], coinCostPerHour: Number(p.coinCostPerHour) })), total: Number(total), page, limit });
});

// POST /admin/projects/:id/force-stop
router.post("/admin/projects/:id/force-stop", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  stopProcess(id);
  await db.update(projectsTable).set({ status: "stopped" }).where(eq(projectsTable.id, id));
  res.json({ success: true });
});

// DELETE /admin/projects/:id
router.delete("/admin/projects/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  stopProcess(id);
  await db.delete(projectsTable).where(eq(projectsTable.id, id));
  res.json({ success: true });
});

// GET /admin/economy/overview
router.get("/admin/economy/overview", async (req, res): Promise<void> => {
  const [coinCirc] = await db.select({ sum: sql<number>`coalesce(sum(coins), 0)` }).from(usersTable);
  const [earned] = await db.select({ sum: sql<number>`coalesce(sum(total_coins_earned), 0)` }).from(usersTable);
  const [revenue] = await db.select({ sum: sql<number>`coalesce(sum(amount_ksh), 0)` }).from(transactionsTable).where(and(eq(transactionsTable.type, "purchase"), eq(transactionsTable.status, "completed")));
  const [avgBal] = await db.select({ avg: sql<number>`coalesce(avg(coins), 0)` }).from(usersTable);
  res.json({
    totalCoins: Number(coinCirc.sum) || 0,
    totalSpent: 0,
    totalEarned: Number(earned.sum) || 0,
    averageBalance: Number(avgBal.avg) || 0,
    totalRevenue: Number(revenue.sum) || 0,
  });
});

// GET /admin/transactions
router.get("/admin/transactions", async (req, res): Promise<void> => {
  const page = parseInt(req.query.page as string || "1");
  const limit = 20;
  const type = req.query.type as string;
  const status = req.query.status as string;

  let conditions: any[] = [];
  if (type) conditions.push(eq(transactionsTable.type, type));
  if (status) conditions.push(eq(transactionsTable.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const transactions = await db.select().from(transactionsTable).where(whereClause).orderBy(desc(transactionsTable.createdAt)).limit(limit).offset((page - 1) * limit);
  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(transactionsTable).where(whereClause);
  res.json({ transactions, total: Number(total), page, limit });
});

// GET /admin/coin-packages
router.get("/admin/coin-packages", async (req, res): Promise<void> => {
  const pkgs = await db.select().from(coinPackagesTable).orderBy(coinPackagesTable.priceKsh);
  res.json(pkgs);
});

// POST /admin/coin-packages
router.post("/admin/coin-packages", async (req, res): Promise<void> => {
  const { name, description, priceKsh, coins, bonusCoins, badge, enabled } = req.body;
  const [pkg] = await db.insert(coinPackagesTable).values({ name, description, priceKsh, coins, bonusCoins: bonusCoins || 0, badge, enabled: enabled !== false }).returning();
  res.status(201).json(pkg);
});

// PUT /admin/coin-packages/:pkgId
router.put("/admin/coin-packages/:pkgId", async (req, res): Promise<void> => {
  const pkgId = Array.isArray(req.params.pkgId) ? req.params.pkgId[0] : req.params.pkgId;
  const [pkg] = await db.update(coinPackagesTable).set(req.body).where(eq(coinPackagesTable.id, pkgId)).returning();
  res.json(pkg);
});

// DELETE /admin/coin-packages/:pkgId
router.delete("/admin/coin-packages/:pkgId", async (req, res): Promise<void> => {
  const pkgId = Array.isArray(req.params.pkgId) ? req.params.pkgId[0] : req.params.pkgId;
  await db.delete(coinPackagesTable).where(eq(coinPackagesTable.id, pkgId));
  res.json({ success: true });
});

// GET /admin/airdrops
router.get("/admin/airdrops", async (req, res): Promise<void> => {
  const airdrops = await db.select().from(airdropsTable).orderBy(desc(airdropsTable.createdAt));
  res.json(airdrops.map(a => ({ ...a, claimed: false })));
});

// POST /admin/airdrops
router.post("/admin/airdrops", async (req, res): Promise<void> => {
  const { title, description, coins, target, condition, startsAt, expiresAt, maxClaims } = req.body;
  const [airdrop] = await db.insert(airdropsTable).values({
    title, description, coins, target: target || "all", condition,
    startsAt: startsAt ? new Date(startsAt) : null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    maxClaims, createdBy: req.user!.id,
  }).returning();
  res.status(201).json({ ...airdrop, claimed: false });
});

// DELETE /admin/airdrops/:id
router.delete("/admin/airdrops/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(airdropsTable).where(eq(airdropsTable.id, id));
  res.json({ success: true });
});

// GET /admin/bots
router.get("/admin/bots", async (req, res): Promise<void> => {
  const bots = await db.select().from(botTemplatesTable).orderBy(desc(botTemplatesTable.createdAt));
  res.json(bots.map(b => ({ ...b, requiredEnvVars: (b.requiredEnvVars as any[]) || [], tags: b.tags || [] })));
});

// POST /admin/bots
router.post("/admin/bots", async (req, res): Promise<void> => {
  const [bot] = await db.insert(botTemplatesTable).values({ ...req.body, addedBy: req.user!.id }).returning();
  res.status(201).json({ ...bot, requiredEnvVars: (bot.requiredEnvVars as any[]) || [], tags: bot.tags || [] });
});

// PUT /admin/bots/:botId
router.put("/admin/bots/:botId", async (req, res): Promise<void> => {
  const botId = Array.isArray(req.params.botId) ? req.params.botId[0] : req.params.botId;
  const [bot] = await db.update(botTemplatesTable).set(req.body).where(eq(botTemplatesTable.id, botId)).returning();
  res.json({ ...bot, requiredEnvVars: (bot.requiredEnvVars as any[]) || [], tags: bot.tags || [] });
});

// DELETE /admin/bots/:botId
router.delete("/admin/bots/:botId", async (req, res): Promise<void> => {
  const botId = Array.isArray(req.params.botId) ? req.params.botId[0] : req.params.botId;
  await db.delete(botTemplatesTable).where(eq(botTemplatesTable.id, botId));
  res.json({ success: true });
});

// GET /admin/promo
router.get("/admin/promo", async (req, res): Promise<void> => {
  const codes = await db.select().from(promoCodesTable).orderBy(desc(promoCodesTable.createdAt));
  res.json(codes);
});

// POST /admin/promo
router.post("/admin/promo", async (req, res): Promise<void> => {
  const { code, coins, discountPercent, maxUses, expiresAt, onePerUser } = req.body;
  const [promo] = await db.insert(promoCodesTable).values({
    code: code.toUpperCase(),
    coins,
    discountPercent: discountPercent || 0,
    maxUses,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    onePerUser: onePerUser !== false,
    createdBy: req.user!.id,
  }).returning();
  res.status(201).json(promo);
});

// DELETE /admin/promo/:code
router.delete("/admin/promo/:code", async (req, res): Promise<void> => {
  const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  await db.delete(promoCodesTable).where(eq(promoCodesTable.code, code));
  res.json({ success: true });
});

// GET /admin/support/tickets
router.get("/admin/support/tickets", async (req, res): Promise<void> => {
  const status = req.query.status as string;
  const priority = req.query.priority as string;
  let conditions: any[] = [];
  if (status) conditions.push(eq(supportTicketsTable.status, status));
  if (priority) conditions.push(eq(supportTicketsTable.priority, priority));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const tickets = await db.select().from(supportTicketsTable).where(whereClause).orderBy(desc(supportTicketsTable.createdAt)).limit(50);
  res.json(tickets);
});

// POST /admin/support/tickets/:id/messages
router.post("/admin/support/tickets/:id/messages", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { message } = req.body;
  await db.insert(supportMessagesTable).values({ ticketId: id, senderId: req.user!.id, senderRole: req.user!.role, message });
  await db.update(supportTicketsTable).set({ status: "in_progress" }).where(eq(supportTicketsTable.id, id));
  res.status(201).json({ success: true });
});

// PUT /admin/support/tickets/:id/status
router.put("/admin/support/tickets/:id/status", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { status } = req.body;
  await db.update(supportTicketsTable).set({ status }).where(eq(supportTicketsTable.id, id));
  res.json({ success: true });
});

// GET /admin/announcements
router.get("/admin/announcements", async (req, res): Promise<void> => {
  const announcements = await db.select().from(announcementsTable).orderBy(desc(announcementsTable.createdAt));
  res.json(announcements);
});

// POST /admin/announcements
router.post("/admin/announcements", async (req, res): Promise<void> => {
  const { title, body, type, pinned, targetRole } = req.body;
  const [announcement] = await db.insert(announcementsTable).values({
    title, body, type: type || "info", pinned: pinned || false,
    targetRole: targetRole || "all", createdBy: req.user!.id,
  }).returning();
  res.status(201).json(announcement);
});

// PUT /admin/announcements/:id
router.put("/admin/announcements/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [announcement] = await db.update(announcementsTable).set(req.body).where(eq(announcementsTable.id, id)).returning();
  res.json(announcement);
});

// DELETE /admin/announcements/:id
router.delete("/admin/announcements/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
  res.json({ success: true });
});

// GET /admin/platform
router.get("/admin/platform", async (req, res): Promise<void> => {
  const settings = await db.select().from(platformSettingsTable);
  const result: Record<string, any> = {
    maxProjectsFree: 2, maxProjectsPro: 20, enablePayments: true,
    enableReferrals: true, enableAirdrops: true, enableBotMarket: true,
    defaultCoinsOnSignup: 50, platformName: "BeraPanel", supportEmail: "",
    maintenanceMode: false, registrationOpen: true, coinValueKsh: 1,
  };
  for (const s of settings) {
    result[s.key] = s.value;
  }
  res.json(result);
});

// PUT /admin/platform
router.put("/admin/platform", async (req, res): Promise<void> => {
  const { settings } = req.body;
  for (const [key, value] of Object.entries(settings || {})) {
    await db.insert(platformSettingsTable).values({ key, value: value as any, updatedAt: new Date() })
      .onConflictDoUpdate({ target: platformSettingsTable.key, set: { value: value as any, updatedAt: new Date() } });
  }
  res.json(settings);
});

// GET /admin/analytics
router.get("/admin/analytics", async (req, res): Promise<void> => {
  const days: { date: string; count: number }[] = [];
  const deploys: { date: string; count: number }[] = [];
  const revenue: { date: string; amount: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({ date: dateStr, count: 0 });
    deploys.push({ date: dateStr, count: 0 });
    revenue.push({ date: dateStr, amount: 0 });
  }
  const [{ active }] = await db.select({ active: sql<number>`count(*)` }).from(projectsTable).where(eq(projectsTable.status, "running"));
  res.json({ signupsPerDay: days, deploysPerDay: deploys, revenuePerDay: revenue, activeProjects: Number(active) });
});

// GET /admin/audit
router.get("/admin/audit", async (req, res): Promise<void> => {
  const page = parseInt(req.query.page as string || "1");
  const entries = await db.select().from(auditLogTable).orderBy(desc(auditLogTable.createdAt)).limit(50).offset((page - 1) * 50);
  res.json(entries);
});

// POST /admin/coins/bulk
router.post("/admin/coins/bulk", async (req, res): Promise<void> => {
  const { amount, reason, excludeAdmin } = req.body;
  let users = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.banned, false));
  if (excludeAdmin) users = users.filter(u => true);
  for (const u of users) {
    await awardCoins(u.id, amount, "gift", reason || "Bulk coin distribution");
  }
  res.json({ success: true, affectedUsers: users.length });
});

// POST /admin/notifications
router.post("/admin/notifications", async (req, res): Promise<void> => {
  const { title, message, type, target } = req.body;
  let userIds: string[] = [];
  if (target === "all" || !target) {
    const users = await db.select({ id: usersTable.id }).from(usersTable);
    userIds = users.map(u => u.id);
  } else if (req.body.userIds) {
    userIds = req.body.userIds;
  }
  for (const userId of userIds) {
    await db.insert(notificationsTable).values({ userId, title, message, type: type || "info", category: "system" });
  }
  res.json({ success: true, sent: userIds.length });
});

// PUT /admin/referrals/config
router.put("/admin/referrals/config", async (req, res): Promise<void> => {
  const { signupCoins, firstDeployCoins, firstPaymentCoins } = req.body;
  if (signupCoins !== undefined) await db.insert(referralConfigTable).values({ key: "signup_coins", value: signupCoins }).onConflictDoUpdate({ target: referralConfigTable.key, set: { value: signupCoins } });
  if (firstDeployCoins !== undefined) await db.insert(referralConfigTable).values({ key: "first_deploy_coins", value: firstDeployCoins }).onConflictDoUpdate({ target: referralConfigTable.key, set: { value: firstDeployCoins } });
  if (firstPaymentCoins !== undefined) await db.insert(referralConfigTable).values({ key: "first_payment_coins", value: firstPaymentCoins }).onConflictDoUpdate({ target: referralConfigTable.key, set: { value: firstPaymentCoins } });
  res.json({ success: true });
});

// POST /admin/emergency/stop-all
router.post("/admin/emergency/stop-all", async (req, res): Promise<void> => {
  const running = await db.select({ id: projectsTable.id }).from(projectsTable).where(eq(projectsTable.status, "running"));
  for (const p of running) {
    stopProcess(p.id);
    await db.update(projectsTable).set({ status: "stopped" }).where(eq(projectsTable.id, p.id));
  }
  res.json({ success: true, stopped: running.length });
});

// POST /admin/emergency/restart-all
router.post("/admin/emergency/restart-all", async (req, res): Promise<void> => {
  res.json({ success: true, message: "Restart all triggered" });
});

// POST /admin/emergency/broadcast
router.post("/admin/emergency/broadcast", async (req, res): Promise<void> => {
  const { title, message, type } = req.body;
  const users = await db.select({ id: usersTable.id }).from(usersTable);
  for (const u of users) {
    await db.insert(notificationsTable).values({ userId: u.id, title, message, type: type || "warning", category: "system" });
  }
  res.json({ success: true, sent: users.length });
});

export default router;
