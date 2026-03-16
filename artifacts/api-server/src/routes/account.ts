import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  sessionsTable,
  notificationsTable,
  announcementsTable,
  supportTicketsTable,
  supportMessagesTable,
  apiKeysTable,
  auditLogTable,
} from "@workspace/db";
import { eq, and, desc, or } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { v4 as uuidv4 } from "uuid";

const router: IRouter = Router();

// PUT /account/profile
router.put("/account/profile", requireAuth, async (req, res): Promise<void> => {
  const { email, bio, avatarUrl } = req.body;
  const updates: Record<string, unknown> = {};
  if (email !== undefined) updates.email = email;
  if (bio !== undefined) updates.bio = bio;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  const [user] = await db.update(usersTable).set(updates as any).where(eq(usersTable.id, req.user!.id)).returning();
  res.json({
    id: user.id, username: user.username, email: user.email, role: user.role,
    coins: user.coins, totalCoinsEarned: user.totalCoinsEarned, banned: user.banned,
    bio: user.bio, avatarUrl: user.avatarUrl, referralCode: user.referralCode,
    telegramEnabled: user.telegramEnabled, emailVerified: user.emailVerified,
    twoFaEnabled: user.twoFaEnabled, streakDays: user.streakDays, loginCount: user.loginCount,
    createdAt: user.createdAt, lastLogin: user.lastLogin,
  });
});

// GET /account/sessions
router.get("/account/sessions", requireAuth, async (req, res): Promise<void> => {
  const sessions = await db.select().from(sessionsTable).where(eq(sessionsTable.userId, req.user!.id)).orderBy(desc(sessionsTable.createdAt));
  const authHeader = req.headers.authorization;
  res.json(sessions.map(s => ({ ...s, current: false })));
});

// DELETE /account/sessions/:id
router.delete("/account/sessions/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(sessionsTable).where(and(eq(sessionsTable.id, id), eq(sessionsTable.userId, req.user!.id)));
  res.json({ success: true });
});

// GET /account/activity
router.get("/account/activity", requireAuth, async (req, res): Promise<void> => {
  const entries = await db.select().from(auditLogTable).where(eq(auditLogTable.actorId, req.user!.id)).orderBy(desc(auditLogTable.createdAt)).limit(50);
  res.json(entries);
});

// GET /notifications
router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const unreadOnly = req.query.unread === "true";
  let query = db.select().from(notificationsTable).where(eq(notificationsTable.userId, req.user!.id));
  const results = await db.select().from(notificationsTable)
    .where(unreadOnly
      ? and(eq(notificationsTable.userId, req.user!.id), eq(notificationsTable.read, false))
      : eq(notificationsTable.userId, req.user!.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(results);
});

// PUT /notifications/:notifId/read
router.put("/notifications/:notifId/read", requireAuth, async (req, res): Promise<void> => {
  const notifId = Array.isArray(req.params.notifId) ? req.params.notifId[0] : req.params.notifId;
  await db.update(notificationsTable).set({ read: true }).where(
    and(eq(notificationsTable.id, notifId), eq(notificationsTable.userId, req.user!.id))
  );
  res.json({ success: true });
});

// POST /notifications/read-all
router.post("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.userId, req.user!.id));
  res.json({ success: true });
});

// DELETE /notifications/:notifId
router.delete("/notifications/:notifId", requireAuth, async (req, res): Promise<void> => {
  const notifId = Array.isArray(req.params.notifId) ? req.params.notifId[0] : req.params.notifId;
  await db.delete(notificationsTable).where(and(eq(notificationsTable.id, notifId), eq(notificationsTable.userId, req.user!.id)));
  res.json({ success: true });
});

// GET /announcements
router.get("/announcements", requireAuth, async (req, res): Promise<void> => {
  const announcements = await db.select().from(announcementsTable)
    .where(eq(announcementsTable.published, true))
    .orderBy(desc(announcementsTable.pinned), desc(announcementsTable.createdAt))
    .limit(20);
  res.json(announcements);
});

// GET /support/tickets
router.get("/support/tickets", requireAuth, async (req, res): Promise<void> => {
  const tickets = await db.select().from(supportTicketsTable)
    .where(eq(supportTicketsTable.userId, req.user!.id))
    .orderBy(desc(supportTicketsTable.createdAt));
  res.json(tickets);
});

// POST /support/tickets
router.post("/support/tickets", requireAuth, async (req, res): Promise<void> => {
  const { subject, category, priority, message } = req.body;
  if (!subject || !message) {
    res.status(400).json({ error: "Subject and message required" });
    return;
  }
  const [ticket] = await db.insert(supportTicketsTable).values({
    userId: req.user!.id,
    subject,
    category: category || "general",
    priority: priority || "normal",
  }).returning();

  await db.insert(supportMessagesTable).values({
    ticketId: ticket.id,
    senderId: req.user!.id,
    senderRole: req.user!.role,
    message,
  });

  res.status(201).json(ticket);
});

// GET /support/tickets/:ticketId
router.get("/support/tickets/:ticketId", requireAuth, async (req, res): Promise<void> => {
  const ticketId = Array.isArray(req.params.ticketId) ? req.params.ticketId[0] : req.params.ticketId;
  const [ticket] = await db.select().from(supportTicketsTable)
    .where(and(eq(supportTicketsTable.id, ticketId), eq(supportTicketsTable.userId, req.user!.id)))
    .limit(1);
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }
  const messages = await db.select().from(supportMessagesTable).where(eq(supportMessagesTable.ticketId, ticketId)).orderBy(supportMessagesTable.createdAt);
  res.json({ ticket, messages });
});

// POST /support/tickets/:ticketId/messages
router.post("/support/tickets/:ticketId/messages", requireAuth, async (req, res): Promise<void> => {
  const ticketId = Array.isArray(req.params.ticketId) ? req.params.ticketId[0] : req.params.ticketId;
  const { message } = req.body;
  await db.insert(supportMessagesTable).values({
    ticketId,
    senderId: req.user!.id,
    senderRole: req.user!.role,
    message,
  });
  res.status(201).json({ success: true });
});

// GET /api/keys
router.get("/api/keys", requireAuth, async (req, res): Promise<void> => {
  const keys = await db.select().from(apiKeysTable).where(eq(apiKeysTable.userId, req.user!.id));
  res.json(keys.map(k => ({ ...k, permissions: (k.permissions as string[]) || [] })));
});

// POST /api/keys
router.post("/api/keys", requireAuth, async (req, res): Promise<void> => {
  const { name, permissions, expiresAt, ipWhitelist, rateLimit } = req.body;
  const key = `bp_live_${uuidv4().replace(/-/g, "")}`;
  const [apiKey] = await db.insert(apiKeysTable).values({
    userId: req.user!.id,
    key,
    name,
    permissions: permissions || ["read"],
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    ipWhitelist: ipWhitelist || [],
    rateLimit: rateLimit || 100,
  }).returning();
  res.status(201).json({ id: apiKey.id, key: apiKey.key, name: apiKey.name, permissions: (apiKey.permissions as string[]) || [], createdAt: apiKey.createdAt });
});

// DELETE /api/keys/:id
router.delete("/api/keys/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(apiKeysTable).where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.userId, req.user!.id)));
  res.json({ success: true });
});

// GET /status
router.get("/status", async (req, res): Promise<void> => {
  const [{ totalProjects }] = await db.select({ totalProjects: eq(supportTicketsTable.id, supportTicketsTable.id) }).from(supportTicketsTable);
  res.json({
    totalProjects: 0,
    runningProjects: 0,
    totalUsers: 0,
    uptime: process.uptime(),
    version: "2.0.0",
    platform: "BeraPanel",
  });
});

export default router;
