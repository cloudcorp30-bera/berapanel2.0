import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  projectsTable,
  deployHistoryTable,
  projectMetricsTable,
  cronJobsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import {
  startProcess,
  stopProcess,
  getLogs,
  addSseClient,
  removeSseClient,
  deployFromGit,
  getProjectDir,
} from "../lib/process-manager.js";
import { awardCoins } from "../lib/coins.js";
import { createNotification } from "../lib/notify.js";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

function mapProject(p: typeof projectsTable.$inferSelect) {
  return {
    ...p,
    envVars: (p.envVars as Record<string, string>) || {},
    tags: p.tags || [],
    coinCostPerHour: Number(p.coinCostPerHour),
  };
}

// GET /projects
router.get("/projects", requireAuth, async (req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable)
    .where(eq(projectsTable.userId, req.user!.id))
    .orderBy(desc(projectsTable.pinned), desc(projectsTable.updatedAt));
  res.json(projects.map(mapProject));
});

// POST /projects
router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const { name, description, repoUrl, branch, startCommand, buildCommand, installCommand, runtime, deploySource } = req.body;
  if (!name) {
    res.status(400).json({ error: "Project name required" });
    return;
  }

  const [project] = await db.insert(projectsTable).values({
    userId: req.user!.id,
    name,
    description,
    repoUrl,
    branch: branch || "main",
    startCommand: startCommand || "node index.js",
    buildCommand,
    installCommand: installCommand || "npm install",
    runtime: runtime || "node",
    deploySource: deploySource || "github",
  }).returning();

  // Create project directory
  const dir = getProjectDir(project.id);
  fs.mkdirSync(dir, { recursive: true });

  res.status(201).json(mapProject(project));
});

// GET /projects/:id
router.get("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select().from(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id)))
    .limit(1);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(mapProject(project));
});

// PUT /projects/:id/settings
router.put("/projects/:id/settings", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const allowed = ["name", "description", "startCommand", "branch", "buildCommand", "runtime", "autoRestart", "sleepEnabled", "sleepAfterMinutes", "healthCheckUrl", "memoryLimitMb", "tags", "isPublic", "pinned", "installCommand"];
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const [project] = await db.update(projectsTable).set(updates as any).where(
    and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))
  ).returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(mapProject(project));
});

// DELETE /projects/:id
router.delete("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  stopProcess(id);
  await db.delete(projectsTable).where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id)));
  res.json({ success: true });
});

// POST /projects/:id/start
router.post("/projects/:id/start", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))
  ).limit(1);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (!project.port) {
    const port = 3001 + Math.floor(Math.random() * 900);
    await db.update(projectsTable).set({ port }).where(eq(projectsTable.id, id));
    project.port = port;
  }
  await startProcess({ ...project, envVars: project.envVars as Record<string, string>, autoRestart: project.autoRestart });
  res.json({ success: true, message: "Project starting..." });
});

// POST /projects/:id/stop
router.post("/projects/:id/stop", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  stopProcess(id);
  await db.update(projectsTable).set({ status: "stopped" }).where(eq(projectsTable.id, id));
  res.json({ success: true });
});

// POST /projects/:id/restart
router.post("/projects/:id/restart", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))
  ).limit(1);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  stopProcess(id);
  if (project.port) {
    await startProcess({ ...project, envVars: project.envVars as Record<string, string>, autoRestart: project.autoRestart });
  }
  res.json({ success: true });
});

// POST /projects/:id/deploy
router.post("/projects/:id/deploy", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))
  ).limit(1);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json({ success: true, message: "Deployment started. Watch the log stream for progress." });

  // Deploy async
  const repoUrl = req.body.repoUrl || project.repoUrl;
  const branch = req.body.branch || project.branch;
  const port = project.port || 3001 + Math.floor(Math.random() * 900);

  try {
    const liveUrl = await deployFromGit({ ...project, repoUrl, branch, port, envVars: project.envVars as Record<string, string> }, req.user!.id);

    // Award first deploy coins if first time
    if (project.deployCount === 0) {
      await awardCoins(req.user!.id, 100, "earn", "First project deployment!");
    }
    await createNotification(req.user!.id, "Deploy Successful", `${project.name} is live at ${liveUrl}`, "success", "deploy");
  } catch (err: any) {
    await createNotification(req.user!.id, "Deploy Failed", `${project.name}: ${err.message}`, "error", "deploy");
  }
});

// GET /projects/:id/deploy-history
router.get("/projects/:id/deploy-history", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const history = await db.select().from(deployHistoryTable)
    .where(eq(deployHistoryTable.projectId, id))
    .orderBy(desc(deployHistoryTable.deployedAt))
    .limit(50);
  res.json(history);
});

// GET /projects/:id/metrics
router.get("/projects/:id/metrics", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const period = req.query.period as string || "24h";
  let since = new Date();
  if (period === "7d") since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  else if (period === "30d") since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  else since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const metrics = await db.select().from(projectMetricsTable)
    .where(and(eq(projectMetricsTable.projectId, id), gte(projectMetricsTable.recordedAt, since)))
    .orderBy(projectMetricsTable.recordedAt)
    .limit(500);
  res.json(metrics);
});

// GET /projects/:id/liveurl
router.get("/projects/:id/liveurl", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id)).limit(1);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json({
    liveUrl: project.liveUrl,
    port: project.port,
    status: project.status,
    customDomain: project.customDomain,
    deployedAt: project.lastDeployedAt,
  });
});

// POST /projects/:id/clone
router.post("/projects/:id/clone", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id)).limit(1);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const [cloned] = await db.insert(projectsTable).values({
    ...project,
    id: undefined as any,
    name: req.body.name || `${project.name}-copy`,
    status: "stopped",
    port: null,
    liveUrl: null,
    deployCount: 0,
    createdAt: undefined as any,
    updatedAt: undefined as any,
  }).returning();
  res.status(201).json(mapProject(cloned));
});

// GET /projects/:id/logs
router.get("/projects/:id/logs", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const lines = parseInt(req.query.lines as string || "200");
  res.json({ logs: getLogs(id, lines) });
});

// GET /projects/:id/stream (SSE)
router.get("/projects/:id/stream", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  addSseClient(id, res);
  res.write(`data: ${JSON.stringify({ type: "connected", ts: new Date().toISOString() })}\n\n`);

  req.on("close", () => {
    removeSseClient(id, res);
  });
});

// GET /projects/:id/env
router.get("/projects/:id/env", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))
  ).limit(1);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json({ env: (project.envVars as Record<string, string>) || {} });
});

// PUT /projects/:id/env
router.put("/projects/:id/env", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { env } = req.body;
  await db.update(projectsTable).set({ envVars: env, updatedAt: new Date() }).where(
    and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))
  );
  res.json({ success: true });
});

// GET /projects/:id/crons
router.get("/projects/:id/crons", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const crons = await db.select().from(cronJobsTable).where(eq(cronJobsTable.projectId, id));
  res.json(crons);
});

// POST /projects/:id/crons
router.post("/projects/:id/crons", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, schedule, command, enabled } = req.body;
  const [cron] = await db.insert(cronJobsTable).values({
    projectId: id,
    name,
    schedule,
    command,
    enabled: enabled !== false,
  }).returning();
  res.status(201).json(cron);
});

// PUT /projects/:id/crons/:cronId
router.put("/projects/:id/crons/:cronId", requireAuth, async (req, res): Promise<void> => {
  const cronId = Array.isArray(req.params.cronId) ? req.params.cronId[0] : req.params.cronId;
  const { name, schedule, command, enabled } = req.body;
  const [cron] = await db.update(cronJobsTable).set({ name, schedule, command, enabled }).where(eq(cronJobsTable.id, cronId)).returning();
  res.json(cron);
});

// DELETE /projects/:id/crons/:cronId
router.delete("/projects/:id/crons/:cronId", requireAuth, async (req, res): Promise<void> => {
  const cronId = Array.isArray(req.params.cronId) ? req.params.cronId[0] : req.params.cronId;
  await db.delete(cronJobsTable).where(eq(cronJobsTable.id, cronId));
  res.json({ success: true });
});

// GET /projects/:id/files
router.get("/projects/:id/files", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const dir = getProjectDir(id);

  function buildTree(dirPath: string, relPath: string = ""): any[] {
    if (!fs.existsSync(dirPath)) return [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries.map(entry => {
      const entryRelPath = relPath ? `${relPath}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        return { name: entry.name, path: entryRelPath, type: "dir", children: buildTree(path.join(dirPath, entry.name), entryRelPath) };
      }
      return { name: entry.name, path: entryRelPath, type: "file" };
    });
  }

  res.json({ tree: buildTree(dir) });
});

// GET /projects/:id/files/content
router.get("/projects/:id/files/content", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const filePath = req.query.path as string;
  if (!filePath) {
    res.status(400).json({ error: "Path required" });
    return;
  }
  const fullPath = path.join(getProjectDir(id), filePath);
  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  const content = fs.readFileSync(fullPath, "utf-8");
  res.json({ content });
});

// PUT /projects/:id/files/content
router.put("/projects/:id/files/content", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { path: filePath, content } = req.body;
  const fullPath = path.join(getProjectDir(id), filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf-8");
  res.json({ success: true });
});

// POST /projects/:id/files/create
router.post("/projects/:id/files/create", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { path: filePath, type } = req.body;
  const fullPath = path.join(getProjectDir(id), filePath);
  if (type === "dir") {
    fs.mkdirSync(fullPath, { recursive: true });
  } else {
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, "", "utf-8");
  }
  res.status(201).json({ success: true });
});

// POST /projects/:id/files/rename
router.post("/projects/:id/files/rename", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { from, to } = req.body;
  const dir = getProjectDir(id);
  fs.renameSync(path.join(dir, from), path.join(dir, to));
  res.json({ success: true });
});

// DELETE /projects/:id/files
router.delete("/projects/:id/files", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const filePath = req.query.path as string;
  const fullPath = path.join(getProjectDir(id), filePath);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true });
  }
  res.json({ success: true });
});

// ─── GitHub Webhook Auto-Deploy ───────────────────────────────────────────────
// POST /projects/:id/webhook  (called by GitHub on every push)
router.post("/projects/:id/webhook", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const secret = req.query.secret as string;

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id)).limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (project.webhookSecret && project.webhookSecret !== secret) {
    res.status(403).json({ error: "Invalid webhook secret" }); return;
  }

  res.json({ success: true, message: "Redeploy triggered" });

  // Async redeploy
  const repoUrl = project.repoUrl;
  const branch = project.branch || "main";
  const port = project.port || 3001;
  try {
    const liveUrl = await deployFromGit({ ...project, repoUrl, branch, port, envVars: project.envVars as Record<string, string> }, project.userId);
    await createNotification(project.userId, "🚀 Auto-Deploy Success", `${project.name} redeployed via GitHub push`, "success", "deploy");
  } catch (err: any) {
    await createNotification(project.userId, "❌ Auto-Deploy Failed", `${project.name}: ${err.message}`, "error", "deploy");
  }
});

// POST /projects/:id/sleep  (pause project to save coins)
router.post("/projects/:id/sleep", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))
  ).limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  await stopProcess(id);
  await db.update(projectsTable).set({ status: "sleeping" }).where(eq(projectsTable.id, id));
  await createNotification(req.user!.id, "💤 Project Sleeping", `${project.name} is sleeping. Coins paused.`, "info", "project");
  res.json({ success: true, status: "sleeping" });
});

// POST /projects/:id/wake  (resume sleeping project)
router.post("/projects/:id/wake", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))
  ).limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  await startProcess(id, project.port || 3001);
  await db.update(projectsTable).set({ status: "running" }).where(eq(projectsTable.id, id));
  await createNotification(req.user!.id, "☀️ Project Woke Up", `${project.name} is back online!`, "success", "project");
  res.json({ success: true, status: "running" });
});

// PATCH /projects/:id/domain  (set custom domain)
router.patch("/projects/:id/domain", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { customDomain } = req.body;
  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))
  ).limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  await db.update(projectsTable).set({ customDomain: customDomain || null }).where(eq(projectsTable.id, id));
  res.json({ success: true, customDomain });
});

// PATCH /projects/:id/settings  (update project settings)
router.patch("/projects/:id/settings", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))
  ).limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const allowed = ["name", "description", "autoRestart", "memoryLimitMb", "startCommand", "installCommand", "branch", "webhookSecret"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const [updated] = await db.update(projectsTable).set(updates).where(eq(projectsTable.id, id)).returning();
  res.json(mapProject(updated));
});

// GET /projects/:id/health  — ping the live URL and return latency + status
router.get("/projects/:id/health", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))
  ).limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  if (!project.liveUrl || project.status !== "running") {
    res.json({ healthy: false, status: project.status, latencyMs: null, checkedAt: new Date().toISOString() });
    return;
  }
  const url = project.liveUrl.startsWith("http") ? project.liveUrl : `https://${project.liveUrl}`;
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, { method: "GET", signal: ctrl.signal, redirect: "follow" });
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;
    res.json({ healthy: r.ok || r.status < 500, statusCode: r.status, latencyMs, checkedAt: new Date().toISOString() });
  } catch (err: any) {
    res.json({ healthy: false, statusCode: null, latencyMs: null, error: err.message, checkedAt: new Date().toISOString() });
  }
});

// GET /projects/stats  — aggregate stats for the dashboard
router.get("/projects/stats", requireAuth, async (req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable).where(eq(projectsTable.userId, req.user!.id));
  const stats = {
    total: projects.length,
    running: projects.filter(p => p.status === "running").length,
    sleeping: projects.filter(p => p.status === "sleeping").length,
    building: projects.filter(p => p.status === "building").length,
    error: projects.filter(p => p.status === "error").length,
    stopped: projects.filter(p => p.status === "stopped").length,
    totalCoinsPerHour: projects.filter(p => p.status === "running").reduce((s, p) => s + (p.coinCostPerHour || 0), 0),
    totalDeploys: projects.reduce((s, p) => s + (p.deployCount || 0), 0),
  };
  res.json(stats);
});

// GET /templates
router.get("/templates", async (req, res): Promise<void> => {
  const templates = [
    { id: "node-express", name: "Express API", description: "Simple Node.js Express REST API", runtime: "node", repoUrl: "", tags: ["node", "express", "api"] },
    { id: "python-flask", name: "Flask App", description: "Python Flask web application", runtime: "python", repoUrl: "", tags: ["python", "flask"] },
    { id: "telegram-bot", name: "Telegram Bot", description: "Node.js Telegram bot template", runtime: "node", repoUrl: "", tags: ["telegram", "bot"] },
    { id: "discord-bot", name: "Discord Bot", description: "Discord.js bot template", runtime: "node", repoUrl: "", tags: ["discord", "bot"] },
    { id: "next-app", name: "Next.js App", description: "Next.js React application", runtime: "node", repoUrl: "", tags: ["react", "next", "frontend"] },
  ];
  res.json(templates);
});

export default router;
