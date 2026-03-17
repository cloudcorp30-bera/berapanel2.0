import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  botTemplatesTable,
  botReviewsTable,
  projectsTable,
  usersTable,
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { spendCoins, awardCoins } from "../lib/coins.js";
import { getLiveUrl, deployFromGit } from "../lib/process-manager.js";
import { createNotification } from "../lib/notify.js";

const router: IRouter = Router();

function mapBot(b: typeof botTemplatesTable.$inferSelect) {
  return {
    ...b,
    requiredEnvVars: (b.requiredEnvVars as any[]) || [],
    tags: b.tags || [],
  };
}

// GET /bots
router.get("/bots", async (req, res): Promise<void> => {
  const bots = await db.select().from(botTemplatesTable).where(eq(botTemplatesTable.enabled, true)).orderBy(desc(botTemplatesTable.deployCount));
  res.json(bots.map(mapBot));
});

// GET /bots/categories
router.get("/bots/categories", async (req, res): Promise<void> => {
  const results = await db.select({
    category: botTemplatesTable.category,
    count: sql<number>`count(*)`,
  }).from(botTemplatesTable).where(eq(botTemplatesTable.enabled, true)).groupBy(botTemplatesTable.category);
  res.json(results.map(r => ({ category: r.category || "other", count: Number(r.count) })));
});

// GET /bots/featured
router.get("/bots/featured", async (req, res): Promise<void> => {
  const bots = await db.select().from(botTemplatesTable)
    .where(eq(botTemplatesTable.featured, true))
    .limit(6);
  res.json(bots.map(mapBot));
});

// GET /bots/:id
router.get("/bots/:id", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [bot] = await db.select().from(botTemplatesTable).where(eq(botTemplatesTable.id, id)).limit(1);
  if (!bot || !bot.enabled) {
    res.status(404).json({ error: "Bot template not found" });
    return;
  }
  res.json(mapBot(bot));
});

// POST /bots/:id/deploy
router.post("/bots/:id/deploy", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [bot] = await db.select().from(botTemplatesTable).where(eq(botTemplatesTable.id, id)).limit(1);
  if (!bot || !bot.enabled) {
    res.status(404).json({ error: "Bot template not found" });
    return;
  }

  const { projectName, envVars } = req.body;
  if (!projectName) {
    res.status(400).json({ error: "Project name required" });
    return;
  }

  // Validate required env vars on the server
  const requiredVars = (bot.requiredEnvVars as Array<{key:string;label:string;required?:boolean}>) || [];
  const userEnv = (envVars as Record<string, string>) || {};
  const missing = requiredVars.filter(v => v.required !== false && !userEnv[v.key]?.trim());
  if (missing.length > 0) {
    res.status(400).json({ error: `Missing required fields: ${missing.map(v => v.label).join(", ")}` });
    return;
  }

  // Deduct coin cost if required
  if ((bot.coinCost || 0) > 0) {
    const ok = await spendCoins(req.user!.id, bot.coinCost!, "spend", `Deploy bot: ${bot.name}`);
    if (!ok) {
      res.status(402).json({ error: `Insufficient coins. Required: ${bot.coinCost}` });
      return;
    }
  }

  const [project] = await db.insert(projectsTable).values({
    userId: req.user!.id,
    name: projectName,
    description: bot.description || undefined,
    repoUrl: bot.repoUrl || undefined,
    branch: bot.branch,
    startCommand: bot.startCommand || "node index.js",
    installCommand: bot.installCommand,
    runtime: bot.runtime,
    envVars: userEnv,
    deploySource: "bot_template",
    botTemplateId: id,
  } as any).returning();

  // Respond immediately so the frontend can redirect to the project page
  res.status(201).json({
    ...project,
    liveUrl: getLiveUrl(project.id),
    envVars: userEnv,
    tags: project.tags || [],
    coinCostPerHour: Number(project.coinCostPerHour),
  });

  // Auto-trigger deployment in the background (user can watch logs on project page)
  setImmediate(async () => {
    try {
      await db.update(botTemplatesTable)
        .set({ deployCount: (bot.deployCount || 0) + 1 })
        .where(eq(botTemplatesTable.id, id));

      const liveUrl = await deployFromGit({
        ...project,
        repoUrl: bot.repoUrl || null,
        branch: bot.branch,
        startCommand: bot.startCommand || "node index.js",
        installCommand: bot.installCommand,
        buildCommand: null,
        envVars: userEnv,
        port: null,
        autoRestart: true,
        runtime: bot.runtime,
        templateId: id,
      }, req.user!.id);

      if (project.deployCount === 0) {
        await awardCoins(req.user!.id, 100, "earn", "First project deployment!");
      }
      await createNotification(req.user!.id, "Bot Deployed! 🚀", `${bot.name} is live at ${liveUrl}`, "success", "deploy");
    } catch (err: any) {
      console.error(`[marketplace] Deploy failed for ${project.id}:`, err.message);
      await createNotification(req.user!.id, "Deploy Failed", `${bot.name}: ${err.message}`, "error", "deploy");
    }
  });
});

// POST /bots/:id/review
router.post("/bots/:id/review", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be 1-5" });
    return;
  }

  try {
    await db.insert(botReviewsTable).values({
      templateId: id,
      userId: req.user!.id,
      rating,
      comment,
    });
    const [bot] = await db.select().from(botTemplatesTable).where(eq(botTemplatesTable.id, id)).limit(1);
    if (bot) {
      await db.update(botTemplatesTable).set({
        ratingSum: (bot.ratingSum || 0) + rating,
        ratingCount: (bot.ratingCount || 0) + 1,
      }).where(eq(botTemplatesTable.id, id));
    }
    res.status(201).json({ success: true });
  } catch {
    res.status(400).json({ error: "Already reviewed this bot" });
  }
});

// GET /bots/:id/reviews
router.get("/bots/:id/reviews", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const reviews = await db.select().from(botReviewsTable).where(eq(botReviewsTable.templateId, id)).orderBy(desc(botReviewsTable.createdAt));
  res.json(reviews);
});

export default router;
