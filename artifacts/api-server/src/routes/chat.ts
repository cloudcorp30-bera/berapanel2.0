import { Router } from "express";
import { db } from "@workspace/db";
import { chatChannelsTable, chatMessagesTable, usersTable } from "@workspace/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { requireAuth, verifyToken } from "../lib/auth.js";

const router = Router();

const DEFAULT_CHANNELS = [
  { name: "General", slug: "general", description: "General developer discussion", icon: "💬" },
  { name: "Help", slug: "help", description: "Ask questions, get answers", icon: "🆘" },
  { name: "Showcase", slug: "showcase", description: "Show off what you built", icon: "🚀" },
  { name: "Deploy Logs", slug: "deploy-logs", description: "Share deployment stories", icon: "📋" },
  { name: "Random", slug: "random", description: "Off-topic conversations", icon: "🎲" },
];

async function ensureDefaultChannels() {
  for (const ch of DEFAULT_CHANNELS) {
    const existing = await db.select().from(chatChannelsTable).where(eq(chatChannelsTable.slug, ch.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(chatChannelsTable).values(ch);
    }
  }
}

router.get("/chat/channels", requireAuth, async (req, res): Promise<void> => {
  await ensureDefaultChannels();
  const channels = await db.select().from(chatChannelsTable).orderBy(asc(chatChannelsTable.createdAt));
  res.json({ channels });
});

router.get("/chat/channels/:slug/messages", requireAuth, async (req, res): Promise<void> => {
  const { slug } = req.params;
  const limit = Math.min(parseInt((req.query.limit as string) || "50"), 100);
  const channel = await db.select().from(chatChannelsTable).where(eq(chatChannelsTable.slug, slug)).limit(1);
  if (!channel[0]) { res.status(404).json({ error: "Channel not found" }); return; }

  const messages = await db
    .select({
      id: chatMessagesTable.id,
      channelId: chatMessagesTable.channelId,
      userId: chatMessagesTable.userId,
      content: chatMessagesTable.content,
      replyToId: chatMessagesTable.replyToId,
      edited: chatMessagesTable.edited,
      createdAt: chatMessagesTable.createdAt,
      username: usersTable.username,
      emailVerified: usersTable.emailVerified,
      role: usersTable.role,
    })
    .from(chatMessagesTable)
    .leftJoin(usersTable, eq(chatMessagesTable.userId, usersTable.id))
    .where(eq(chatMessagesTable.channelId, channel[0].id))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(limit);

  res.json({ channel: channel[0], messages: messages.reverse() });
});

router.post("/chat/channels/:slug/messages", requireAuth, async (req, res): Promise<void> => {
  const { slug } = req.params;
  const { content, replyToId } = req.body;
  if (!content?.trim() || content.length > 2000) { res.status(400).json({ error: "Message must be 1-2000 chars" }); return; }

  const channel = await db.select().from(chatChannelsTable).where(eq(chatChannelsTable.slug, slug)).limit(1);
  if (!channel[0]) { res.status(404).json({ error: "Channel not found" }); return; }

  const [msg] = await db.insert(chatMessagesTable).values({
    channelId: channel[0].id,
    userId: req.user!.id,
    content: content.trim(),
    replyToId: replyToId || null,
  }).returning();

  const user = await db.select({ username: usersTable.username, emailVerified: usersTable.emailVerified, role: usersTable.role })
    .from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);

  const fullMsg = { ...msg, ...user[0] };
  
  const clients = sseClients.get(channel[0].id) || [];
  clients.forEach(c => {
    try { c.write(`data: ${JSON.stringify({ type: "message", payload: fullMsg })}\n\n`); } catch {}
  });
  
  res.json(fullMsg);
});

const sseClients = new Map<string, any[]>();

// SSE stream — accepts token via Authorization header OR ?token= query param (for EventSource)
router.get("/chat/channels/:slug/stream", async (req, res): Promise<void> => {
  // Authenticate via header or query param (EventSource can't set headers)
  let user = null;
  const headerToken = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
  const queryToken = req.query.token as string | undefined;
  const token = headerToken || queryToken;

  if (token) {
    user = verifyToken(token);
  }

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { slug } = req.params;
  const channel = await db.select().from(chatChannelsTable).where(eq(chatChannelsTable.slug, slug)).limit(1);
  if (!channel[0]) { res.status(404).json({ error: "Channel not found" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const channelId = channel[0].id;
  if (!sseClients.has(channelId)) sseClients.set(channelId, []);
  sseClients.get(channelId)!.push(res);

  res.write(`data: ${JSON.stringify({ type: "connected", channelId, username: user.username })}\n\n`);

  const heartbeat = setInterval(() => {
    try { res.write(": ping\n\n"); } catch { clearInterval(heartbeat); }
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    const clients = sseClients.get(channelId) || [];
    sseClients.set(channelId, clients.filter(c => c !== res));
  });
});

router.delete("/chat/messages/:id", requireAuth, async (req, res): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;
  const [msg] = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.id, id)).limit(1);
  if (!msg) { res.status(404).json({ error: "Not found" }); return; }
  if (msg.userId !== user.id && user.role !== "admin" && user.role !== "superadmin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.id, id));
  
  // Notify SSE clients of deletion
  const channel = await db.select().from(chatChannelsTable).where(eq(chatChannelsTable.id, msg.channelId!)).limit(1);
  if (channel[0]) {
    const clients = sseClients.get(channel[0].id) || [];
    clients.forEach(c => {
      try { c.write(`data: ${JSON.stringify({ type: "delete", payload: { id } })}\n\n`); } catch {}
    });
  }

  res.json({ ok: true });
});

export default router;
