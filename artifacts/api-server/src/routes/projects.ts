import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  projectsTable,
  deployHistoryTable,
  projectMetricsTable,
  cronJobsTable,
  usersTable,
  customDomainsTable,
  projectWebhooksTable,
  teamMembersTable,
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
  getLiveUrl,
  detectRuntime,
} from "../lib/process-manager.js";
import { awardCoins } from "../lib/coins.js";
import { createNotification } from "../lib/notify.js";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

function mapProject(p: typeof projectsTable.$inferSelect) {
  return {
    ...p,
    liveUrl: getLiveUrl(p.id),
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

// GET /projects/:id/env/detect  — scan deployed code for env var references
router.get("/projects/:id/env/detect", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))
  ).limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const dir = getProjectDir(id);
  if (!fs.existsSync(dir)) { res.json({ detected: [] }); return; }

  interface DetectedVar { key: string; defaultValue: string; source: string; description: string; }
  const detected = new Map<string, DetectedVar>();

  const addVar = (key: string, defaultValue: string, source: string, description = "") => {
    if (!key || key.length < 2 || key.length > 80 || !/^[A-Z0-9_]+$/i.test(key)) return;
    if (!detected.has(key)) detected.set(key, { key, defaultValue, source, description });
  };

  // Walk directory, skip node_modules / .git / dist / build
  const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "__pycache__", "venv", ".venv"]);
  const TEXT_EXTS = new Set([".js", ".ts", ".jsx", ".tsx", ".py", ".go", ".rb", ".php", ".java",
    ".env", ".env.example", ".env.sample", ".env.template", ".env.local",
    ".cfg", ".ini", ".yaml", ".yml", ".toml", ".conf", ".config", ".json"]);

  function walkDir(dirPath: string, depth = 0) {
    if (depth > 6) return;
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(dirPath, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) { walkDir(fullPath, depth + 1); continue; }
      const ext = path.extname(entry.name).toLowerCase();
      const baseName = entry.name.toLowerCase();
      if (!TEXT_EXTS.has(ext) && !baseName.startsWith(".env")) continue;
      let content: string;
      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > 500_000) continue; // skip files > 500KB
        content = fs.readFileSync(fullPath, "utf8");
      } catch { continue; }

      const relPath = path.relative(dir, fullPath);

      // ── .env.example / .env.sample / .env.template ────────────────────────
      if (/\.(env\.example|env\.sample|env\.template|env\.local|env)$/.test(baseName) || baseName === ".env.example") {
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) {
            // capture description from comments above
            continue;
          }
          const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i);
          if (match) addVar(match[1], match[2].replace(/^["']|["']$/g, ""), relPath, "");
        }
        continue;
      }

      // ── Node.js: process.env.VAR_NAME ─────────────────────────────────────
      if ([".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs"].includes(ext)) {
        const nodePatterns = [
          /process\.env\.([A-Z0-9_]+)/gi,
          /process\.env\[['"]([A-Z0-9_]+)['"]\]/gi,
        ];
        for (const pat of nodePatterns) {
          let m;
          pat.lastIndex = 0;
          while ((m = pat.exec(content)) !== null) addVar(m[1], "", relPath);
        }
        // dotenv: require('dotenv').config() — no extra vars needed
        // config object: { key: process.env.FOO || 'default' }
        const defaultPat = /process\.env\.([A-Z0-9_]+)\s*\|\|\s*['"`]([^'"`]+)['"`]/gi;
        let dm;
        defaultPat.lastIndex = 0;
        while ((dm = defaultPat.exec(content)) !== null) {
          const existing = detected.get(dm[1]);
          if (existing && !existing.defaultValue) existing.defaultValue = dm[2];
          else addVar(dm[1], dm[2], relPath);
        }
      }

      // ── Python: os.environ / os.getenv ────────────────────────────────────
      if (ext === ".py") {
        const pyPatterns = [
          /os\.environ(?:\.get)?\(['"]([A-Z0-9_]+)['"]/gi,
          /os\.getenv\(['"]([A-Z0-9_]+)['"](?:,\s*['"]([^'"]*)['"]\))?/gi,
          /environ\['([A-Z0-9_]+)'\]/gi,
        ];
        for (const pat of pyPatterns) {
          let m;
          pat.lastIndex = 0;
          while ((m = pat.exec(content)) !== null) addVar(m[1], m[2] || "", relPath);
        }
      }

      // ── config.js / config.ts / settings.js / settings.py ─────────────────
      if (/config\.(js|ts|json|yaml|yml|toml)|settings\.(js|ts|py)/.test(baseName)) {
        // Already handled by extension above, but flag the source more clearly
        detected.forEach(v => { if (v.source === relPath) v.description = "From config file"; });
      }

      // ── YAML / TOML: ${VAR} substitutions and env blocks ──────────────────
      if ([".yaml", ".yml", ".toml"].includes(ext)) {
        const substPat = /\$\{([A-Z0-9_]+)\}/gi;
        let m;
        substPat.lastIndex = 0;
        while ((m = substPat.exec(content)) !== null) addVar(m[1], "", relPath);
        // yaml env key: value pairs under environment: sections
        const envBlockPat = /^\s{2,}([A-Z][A-Z0-9_]{2,}):\s*["']?([^"'\n]*)["']?$/gm;
        envBlockPat.lastIndex = 0;
        while ((m = envBlockPat.exec(content)) !== null) addVar(m[1], (m[2] || "").trim(), relPath);
      }

      // ── docker-compose.yml env: blocks ────────────────────────────────────
      if (baseName === "docker-compose.yml" || baseName === "docker-compose.yaml") {
        const dcPat = /^\s+([A-Z0-9_]+)(?:=([^\n]*))?$/gim;
        let m;
        dcPat.lastIndex = 0;
        while ((m = dcPat.exec(content)) !== null) addVar(m[1], (m[2] || "").trim(), relPath);
      }
    }
  }

  walkDir(dir);

  // Sort: .env.example entries first, then alphabetically
  const sorted = Array.from(detected.values()).sort((a, b) => {
    const aIsEnv = a.source.includes(".env");
    const bIsEnv = b.source.includes(".env");
    if (aIsEnv !== bIsEnv) return aIsEnv ? -1 : 1;
    return a.key.localeCompare(b.key);
  });

  res.json({ detected: sorted, scannedDir: dir, total: sorted.length });
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
  await startProcess({ ...project, port: project.port || 3001, envVars: project.envVars as Record<string, string>, autoRestart: project.autoRestart });
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
  const allowed = ["name", "description", "autoRestart", "memoryLimitMb", "startCommand", "installCommand", "buildCommand", "branch", "webhookSecret", "runtime"];
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

// GET /projects/:id/detect-commands — auto-detect build/start commands from deployed code
router.get("/projects/:id/detect-commands", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))
  ).limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const dir = getProjectDir(id);
  if (!fs.existsSync(dir) || fs.readdirSync(dir).length === 0) {
    res.json({ detected: false, message: "No project files found. Deploy from Git first." });
    return;
  }

  const detected = detectRuntime(dir);

  // Try to read package.json scripts
  let allScripts: Record<string, string> = {};
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    allScripts = pkg.scripts || {};
  } catch {}

  res.json({
    detected: true,
    runtime: detected.runtime,
    installCommand: detected.installCommand,
    startCommand: detected.startCommand,
    buildCommand: detected.buildCommand,
    availableScripts: allScripts,
    files: fs.readdirSync(dir).slice(0, 20),
  });
});

// GET /templates
router.get("/templates", async (req, res): Promise<void> => {
  const templates = [
    { id: "node-express", name: "Express API", description: "Simple Node.js Express REST API", runtime: "node", installCommand: "npm install", startCommand: "node index.js", repoUrl: "", tags: ["node", "express", "api"], icon: "🟢" },
    { id: "python-flask", name: "Flask App", description: "Python Flask web application", runtime: "python", installCommand: "pip install -r requirements.txt", startCommand: "python app.py", repoUrl: "", tags: ["python", "flask"], icon: "🐍" },
    { id: "python-fastapi", name: "FastAPI", description: "Python FastAPI async REST API", runtime: "python", installCommand: "pip install -r requirements.txt", startCommand: "uvicorn main:app --host 0.0.0.0 --port $PORT", repoUrl: "", tags: ["python", "fastapi", "api"], icon: "⚡" },
    { id: "telegram-bot", name: "Telegram Bot", description: "Node.js Telegram bot template", runtime: "node", installCommand: "npm install", startCommand: "node bot.js", repoUrl: "", tags: ["telegram", "bot"], icon: "✈️" },
    { id: "discord-bot", name: "Discord Bot", description: "Discord.js bot template", runtime: "node", installCommand: "npm install", startCommand: "node index.js", repoUrl: "", tags: ["discord", "bot"], icon: "🎮" },
    { id: "next-app", name: "Next.js App", description: "Next.js React application", runtime: "node", installCommand: "npm install", startCommand: "npm start", buildCommand: "npm run build", repoUrl: "", tags: ["react", "next", "frontend"], icon: "▲" },
    { id: "static-site", name: "Static Site", description: "HTML/CSS/JS static website", runtime: "static", installCommand: "echo done", startCommand: "npx serve . -p $PORT", repoUrl: "", tags: ["html", "css", "static"], icon: "🌐" },
    { id: "go-api", name: "Go API", description: "Go Gin REST API server", runtime: "go", installCommand: "go mod download", startCommand: "go run .", repoUrl: "", tags: ["go", "gin", "api"], icon: "🐹" },
    { id: "whatsapp-bot", name: "WhatsApp Bot", description: "Node.js WhatsApp bot (Baileys)", runtime: "node", installCommand: "npm install", startCommand: "node index.js", repoUrl: "", tags: ["whatsapp", "bot"], icon: "💬" },
    { id: "bun-app", name: "Bun App", description: "Fast Bun JavaScript runtime app", runtime: "bun", installCommand: "bun install", startCommand: "bun index.ts", repoUrl: "", tags: ["bun", "typescript"], icon: "🍞" },
  ];
  res.json(templates);
});

// ─── Custom Domains CRUD ──────────────────────────────────────────────────────
router.get("/projects/:id/domains", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select({ id: projectsTable.id }).from(projectsTable).where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))).limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const domains = await db.select().from(customDomainsTable).where(eq(customDomainsTable.projectId, id));
  res.json({ domains });
});

router.post("/projects/:id/domains", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { domain } = req.body;
  if (!domain?.trim()) { res.status(400).json({ error: "Domain required" }); return; }
  const [project] = await db.select().from(projectsTable).where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))).limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const txtRecord = `berapanel-verify=${Math.random().toString(36).substring(2, 18)}`;
  const cnameTarget = `${id}.berapanel.app`;
  const [newDomain] = await db.insert(customDomainsTable).values({ projectId: id, domain: domain.trim().toLowerCase(), cnameTarget, txtRecord }).returning();
  res.json(newDomain);
});

router.post("/projects/:id/domains/:domainId/verify", requireAuth, async (req, res): Promise<void> => {
  const { id, domainId } = req.params;
  const [domain] = await db.select().from(customDomainsTable).where(and(eq(customDomainsTable.id, domainId), eq(customDomainsTable.projectId, id))).limit(1);
  if (!domain) { res.status(404).json({ error: "Domain not found" }); return; }
  // In production, do real DNS lookup; here we simulate success after adding
  await db.update(customDomainsTable).set({ verified: true, verifiedAt: new Date(), sslEnabled: true }).where(eq(customDomainsTable.id, domainId));
  res.json({ success: true, verified: true });
});

router.delete("/projects/:id/domains/:domainId", requireAuth, async (req, res): Promise<void> => {
  const { id, domainId } = req.params;
  await db.delete(customDomainsTable).where(and(eq(customDomainsTable.id, domainId), eq(customDomainsTable.projectId, id)));
  res.json({ success: true });
});

// ─── Outbound Webhooks CRUD ───────────────────────────────────────────────────
const WEBHOOK_EVENTS = ["deploy.success", "deploy.failed", "project.started", "project.stopped", "project.error"];

router.get("/projects/:id/webhooks", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select({ id: projectsTable.id }).from(projectsTable).where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))).limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const webhooks = await db.select().from(projectWebhooksTable).where(eq(projectWebhooksTable.projectId, id));
  res.json({ webhooks, availableEvents: WEBHOOK_EVENTS });
});

router.post("/projects/:id/webhooks", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { url, events, secret } = req.body;
  if (!url?.trim()) { res.status(400).json({ error: "URL required" }); return; }
  const [project] = await db.select({ id: projectsTable.id }).from(projectsTable).where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))).limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const [hook] = await db.insert(projectWebhooksTable).values({ projectId: id, url: url.trim(), events: events || WEBHOOK_EVENTS, secret: secret || null }).returning();
  res.json(hook);
});

router.patch("/projects/:id/webhooks/:hookId", requireAuth, async (req, res): Promise<void> => {
  const { id, hookId } = req.params;
  const { url, events, secret, enabled } = req.body;
  const updates: Record<string, any> = {};
  if (url !== undefined) updates.url = url;
  if (events !== undefined) updates.events = events;
  if (secret !== undefined) updates.secret = secret;
  if (enabled !== undefined) updates.enabled = enabled;
  const [hook] = await db.update(projectWebhooksTable).set(updates).where(and(eq(projectWebhooksTable.id, hookId), eq(projectWebhooksTable.projectId, id))).returning();
  res.json(hook);
});

router.delete("/projects/:id/webhooks/:hookId", requireAuth, async (req, res): Promise<void> => {
  const { id, hookId } = req.params;
  await db.delete(projectWebhooksTable).where(and(eq(projectWebhooksTable.id, hookId), eq(projectWebhooksTable.projectId, id)));
  res.json({ success: true });
});

// ─── Team Members ─────────────────────────────────────────────────────────────
router.get("/projects/:id/team", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [project] = await db.select().from(projectsTable).where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))).limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const members = await db.select({
    id: teamMembersTable.id,
    projectId: teamMembersTable.projectId,
    userId: teamMembersTable.userId,
    role: teamMembersTable.role,
    joinedAt: teamMembersTable.joinedAt,
    username: usersTable.username,
    emailVerified: usersTable.emailVerified,
  }).from(teamMembersTable).leftJoin(usersTable, eq(teamMembersTable.userId, usersTable.id)).where(eq(teamMembersTable.projectId, id));
  res.json({ members, owner: { id: project.userId } });
});

router.post("/projects/:id/team", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { username, role } = req.body;
  if (!username?.trim()) { res.status(400).json({ error: "Username required" }); return; }
  const [project] = await db.select().from(projectsTable).where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.id))).limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  const [invitee] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username.trim())).limit(1);
  if (!invitee) { res.status(404).json({ error: "User not found" }); return; }
  if (invitee.id === req.user!.id) { res.status(400).json({ error: "Cannot invite yourself" }); return; }
  const existing = await db.select().from(teamMembersTable).where(and(eq(teamMembersTable.projectId, id), eq(teamMembersTable.userId, invitee.id))).limit(1);
  if (existing.length > 0) { res.status(400).json({ error: "User already a member" }); return; }
  const [member] = await db.insert(teamMembersTable).values({ projectId: id, userId: invitee.id, role: role || "viewer", invitedBy: req.user!.id }).returning();
  res.json(member);
});

router.delete("/projects/:id/team/:memberId", requireAuth, async (req, res): Promise<void> => {
  const { id, memberId } = req.params;
  await db.delete(teamMembersTable).where(and(eq(teamMembersTable.id, memberId), eq(teamMembersTable.projectId, id)));
  res.json({ success: true });
});

export default router;
