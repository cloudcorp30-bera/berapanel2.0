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
import { spendCoins } from "../lib/coins.js";
import { getProjectDir, getLiveUrl } from "../lib/process-manager.js";
import fs from "fs";
import path from "path";

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
  }).returning();

  const projectDir = getProjectDir(project.id);
  fs.mkdirSync(projectDir, { recursive: true });

  // Check for a local zip file for this bot (slugified name)
  // In production: cwd = workspace root, server binary is at artifacts/api-server/dist/
  // In dev: cwd = artifacts/api-server/
  const botSlug = bot.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const candidates = [
    path.join(process.cwd(), "artifacts/api-server/bot_zips", `${botSlug}.zip`),
    path.join(process.cwd(), "bot_zips", `${botSlug}.zip`),
  ];
  const zipPath = candidates.find(p => fs.existsSync(p)) || candidates[0];

  if (fs.existsSync(zipPath)) {
    // Extract zip directly to project dir (auto-deploy from local zip)
    try {
      const { default: AdmZip } = await import("adm-zip");
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();

      // Find the root folder prefix (e.g. "atassa-main/")
      const prefix = entries.find(e => e.isDirectory)?.entryName || "";

      for (const entry of entries) {
        if (entry.isDirectory) continue;
        const relativePath = prefix ? entry.entryName.replace(prefix, "") : entry.entryName;
        if (!relativePath) continue;
        const destPath = path.join(projectDir, relativePath);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.writeFileSync(destPath, entry.getData());
      }

      // Write the .env file with user-provided vars
      const envContent = Object.entries(userEnv).map(([k, v]) => `${k}=${v}`).join("\n");
      fs.writeFileSync(path.join(projectDir, ".env"), envContent);

      // Mark as "cloned" so deploy just runs install + start
      await db.update(projectsTable).set({ status: "idle" }).where(eq(projectsTable.id, project.id));
    } catch (err: any) {
      console.error("Zip extraction failed:", err.message);
    }
  }

  // Increment deploy count
  await db.update(botTemplatesTable).set({ deployCount: (bot.deployCount || 0) + 1 }).where(eq(botTemplatesTable.id, id));

  res.status(201).json({
    ...project,
    liveUrl: getLiveUrl(project.id),
    envVars: userEnv,
    tags: project.tags || [],
    coinCostPerHour: Number(project.coinCostPerHour),
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
