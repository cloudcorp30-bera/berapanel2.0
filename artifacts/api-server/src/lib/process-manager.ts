import { spawn } from "child_process";
import type { ChildProcess } from "child_process";
import type { Response } from "express";
import path from "path";
import fs from "fs";
import { db } from "@workspace/db";
import { projectsTable, deployHistoryTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const PROJECTS_DIR = process.env.PROJECTS_DIR || path.join(process.cwd(), "bp_projects");
const PORT_MIN = 3001;
const PORT_MAX = 4000;

// Base URL for live project URLs - production deployment URL
const BASE_URL = process.env.BASE_URL || "https://bruce-panel-1.replit.app";

if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

const processes = new Map<string, ChildProcess>();
const logBuffers = new Map<string, string[]>();
const sseClients = new Map<string, Set<Response>>();
const usedPorts = new Set<number>();

function assignPort(): number {
  for (let p = PORT_MIN; p <= PORT_MAX; p++) {
    if (!usedPorts.has(p)) {
      usedPorts.add(p);
      return p;
    }
  }
  throw new Error("No available ports");
}

function releasePort(port: number) {
  usedPorts.delete(port);
}

function broadcastLog(projectId: string, data: string) {
  const buf = logBuffers.get(projectId) || [];
  buf.push(data);
  if (buf.length > 1000) buf.shift();
  logBuffers.set(projectId, buf);

  const clients = sseClients.get(projectId);
  if (clients) {
    for (const res of clients) {
      try {
        res.write(`data: ${JSON.stringify({ type: "log", data, ts: new Date().toISOString() })}\n\n`);
      } catch {}
    }
  }
}

export function addSseClient(projectId: string, res: Response) {
  if (!sseClients.has(projectId)) sseClients.set(projectId, new Set());
  sseClients.get(projectId)!.add(res);
}

export function removeSseClient(projectId: string, res: Response) {
  sseClients.get(projectId)?.delete(res);
}

export function getLogs(projectId: string, lines = 200): string {
  const buf = logBuffers.get(projectId) || [];
  return buf.slice(-lines).join("");
}

export function getLiveUrl(projectId: string): string {
  return `${BASE_URL}/app/${projectId}/`;
}

// ── Language / Runtime Detection ───────────────────────────────────────────────
export function detectRuntime(dir: string): {
  runtime: string;
  installCommand: string;
  startCommand: string;
  buildCommand: string | null;
} {
  const has = (f: string) => fs.existsSync(path.join(dir, f));
  const read = (f: string): any => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { return null; }
  };

  // Node.js
  if (has("package.json")) {
    const pkg = read("package.json");
    const start = pkg?.scripts?.start || pkg?.scripts?.["start:prod"] || null;
    const build = pkg?.scripts?.build || null;
    const isNextJs = !!pkg?.dependencies?.next || !!pkg?.devDependencies?.next;
    const isVite = !!pkg?.dependencies?.vite || !!pkg?.devDependencies?.vite;
    const usesPM = has("pnpm-lock.yaml") ? "pnpm" : has("yarn.lock") ? "yarn" : "npm";
    let installCmd = `${usesPM} install`;
    let startCmd = start || (isNextJs ? "node .next/standalone/server.js" : "node index.js");
    let buildCmd = build || (isNextJs ? `${usesPM} run build` : null);
    return { runtime: "node", installCommand: installCmd, startCommand: startCmd, buildCommand: buildCmd };
  }

  // Python
  if (has("requirements.txt") || has("pyproject.toml") || has("Pipfile")) {
    const mainFile = has("main.py") ? "main.py" : has("app.py") ? "app.py" : has("server.py") ? "server.py" : has("run.py") ? "run.py" : "main.py";
    const installCmd = has("Pipfile") ? "pip install pipenv && pipenv install" : has("pyproject.toml") ? "pip install ." : "pip install -r requirements.txt";
    return { runtime: "python", installCommand: installCmd, startCommand: `python ${mainFile}`, buildCommand: null };
  }

  // Go
  if (has("go.mod")) {
    return { runtime: "go", installCommand: "go mod download", startCommand: "go run .", buildCommand: "go build -o app . && ./app" };
  }

  // Bun
  if (has("bun.lockb")) {
    const pkg = read("package.json");
    const start = pkg?.scripts?.start || null;
    return { runtime: "bun", installCommand: "bun install", startCommand: start || "bun index.ts", buildCommand: pkg?.scripts?.build ? "bun run build" : null };
  }

  // PHP
  if (has("composer.json") || has("index.php")) {
    return { runtime: "php", installCommand: has("composer.json") ? "composer install" : "echo 'no deps'", startCommand: "php -S 0.0.0.0:$PORT", buildCommand: null };
  }

  // Ruby
  if (has("Gemfile")) {
    const mainFile = has("config.ru") ? "config.ru" : "app.rb";
    return { runtime: "ruby", installCommand: "bundle install", startCommand: has("config.ru") ? "bundle exec rackup -p $PORT" : `ruby ${mainFile}`, buildCommand: null };
  }

  // Static sites (HTML only)
  if (has("index.html") || has("public/index.html")) {
    return { runtime: "static", installCommand: "echo 'Static site - no install needed'", startCommand: "npx serve . -p $PORT", buildCommand: null };
  }

  // Deno
  if (has("deno.json") || has("deno.jsonc") || has("mod.ts")) {
    return { runtime: "deno", installCommand: "echo 'Deno - no install step'", startCommand: "deno run --allow-all mod.ts", buildCommand: null };
  }

  // Fallback: Node
  return { runtime: "node", installCommand: "npm install", startCommand: "node index.js", buildCommand: null };
}

// ── Auto-detect start command from package.json after clone ────────────────────
export function detectStartCommand(dir: string): string | null {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    return pkg?.scripts?.start || pkg?.scripts?.["start:prod"] || null;
  } catch {
    return null;
  }
}

export async function startProcess(project: { id: string; startCommand: string; envVars: Record<string, string> | null; port: number; autoRestart: boolean }): Promise<void> {
  const dir = path.join(PROJECTS_DIR, project.id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  stopProcess(project.id);

  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    ...(project.envVars || {}),
    PORT: String(project.port),
  };

  const proc = spawn("sh", ["-c", project.startCommand], {
    cwd: dir,
    env,
    stdio: ["pipe", "pipe", "pipe"],
  });

  processes.set(project.id, proc);
  broadcastLog(project.id, `[BeraPanel] Starting: ${project.startCommand}\n`);

  proc.stdout?.on("data", (d: Buffer) => broadcastLog(project.id, d.toString()));
  proc.stderr?.on("data", (d: Buffer) => broadcastLog(project.id, d.toString()));

  proc.on("exit", async (code) => {
    broadcastLog(project.id, `[BeraPanel] Process exited with code ${code}\n`);
    processes.delete(project.id);

    await db.update(projectsTable)
      .set({ status: code === 0 ? "stopped" : "error", crashCount: (project as any).crashCount + 1 })
      .where(eq(projectsTable.id, project.id));

    if (project.autoRestart && code !== 0) {
      broadcastLog(project.id, `[BeraPanel] Auto-restarting in 3s...\n`);
      setTimeout(() => startProcess(project), 3000);
    }
  });

  await db.update(projectsTable).set({ status: "running", port: project.port }).where(eq(projectsTable.id, project.id));
}

export function stopProcess(projectId: string): void {
  const proc = processes.get(projectId);
  if (proc) {
    proc.kill("SIGTERM");
    setTimeout(() => {
      if (!proc.killed) proc.kill("SIGKILL");
    }, 5000);
    processes.delete(projectId);
  }
}

export function isRunning(projectId: string): boolean {
  return processes.has(projectId);
}

export async function deployFromGit(
  project: { id: string; repoUrl: string | null; branch: string; installCommand: string; startCommand: string; buildCommand: string | null; envVars: Record<string, string> | null; port: number | null; autoRestart: boolean; runtime?: string },
  userId?: string
): Promise<string> {
  const dir = path.join(PROJECTS_DIR, project.id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const port = project.port || assignPort();
  const startTime = Date.now();
  let buildLog = "";

  const log = (msg: string) => {
    buildLog += msg;
    broadcastLog(project.id, msg);
  };

  const deployId = (await db.insert(deployHistoryTable).values({
    projectId: project.id,
    userId,
    source: "git",
    status: "building",
  }).returning({ id: deployHistoryTable.id }))[0].id;

  await db.update(projectsTable).set({ status: "building", port }).where(eq(projectsTable.id, project.id));

  try {
    const repoUrl = project.repoUrl || "";
    log(`[BeraPanel] ════════════════════════════════════════\n`);
    log(`[BeraPanel] Deploying from: ${repoUrl}\n`);
    log(`[BeraPanel] Branch: ${project.branch}\n`);
    log(`[BeraPanel] ════════════════════════════════════════\n`);

    const runCmd = (cmd: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        log(`[BeraPanel] $ ${cmd}\n`);
        const proc = spawn("sh", ["-c", cmd], { cwd: dir, stdio: ["pipe", "pipe", "pipe"] });
        proc.stdout?.on("data", (d: Buffer) => log(d.toString()));
        proc.stderr?.on("data", (d: Buffer) => log(d.toString()));
        proc.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`Exit ${code}`))));
      });
    };

    // Clone / pull
    if (fs.existsSync(path.join(dir, ".git"))) {
      await runCmd(`git fetch origin && git checkout ${project.branch} && git pull origin ${project.branch}`);
    } else {
      await runCmd(`git clone --depth 1 --branch ${project.branch} ${repoUrl} .`);
    }

    // Auto-detect runtime and commands after clone if not explicitly set or if default
    const detected = detectRuntime(dir);
    let installCommand = project.installCommand || detected.installCommand;
    let startCommand = project.startCommand;
    let buildCommand = project.buildCommand;

    // If start command is still the generic default, try to get from package.json
    if (startCommand === "node index.js" && detected.runtime === "node") {
      const pkgStart = detectStartCommand(dir);
      if (pkgStart) {
        startCommand = pkgStart;
        log(`[BeraPanel] Auto-detected start command from package.json: ${startCommand}\n`);
      }
    }

    // If runtime mismatch, use detected values
    if (project.runtime !== detected.runtime && project.runtime === "node" && detected.runtime !== "node") {
      installCommand = detected.installCommand;
      startCommand = detected.startCommand;
      buildCommand = detected.buildCommand;
      log(`[BeraPanel] Auto-detected runtime: ${detected.runtime}\n`);
    }

    log(`[BeraPanel] Runtime: ${detected.runtime}\n`);
    log(`[BeraPanel] Install: ${installCommand}\n`);
    log(`[BeraPanel] Start:   ${startCommand}\n`);
    if (buildCommand) log(`[BeraPanel] Build:   ${buildCommand}\n`);

    // Install
    log(`[BeraPanel] ── Installing dependencies ──\n`);
    await runCmd(installCommand);

    // Build
    if (buildCommand) {
      log(`[BeraPanel] ── Building ──\n`);
      await runCmd(buildCommand);
    }

    const liveUrl = getLiveUrl(project.id);
    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Update project with detected runtime/commands
    await db.update(projectsTable).set({
      status: "running",
      port,
      liveUrl,
      lastDeployedAt: new Date(),
      deployCount: (project as any).deployCount ? (project as any).deployCount + 1 : 1,
      startCommand,
      installCommand,
      ...(buildCommand !== undefined ? { buildCommand } : {}),
      runtime: detected.runtime,
    }).where(eq(projectsTable.id, project.id));

    await db.update(deployHistoryTable).set({ status: "success", buildLog, durationSeconds: duration }).where(eq(deployHistoryTable.id, deployId));

    // Start the process
    await startProcess({ ...project, startCommand, port, autoRestart: project.autoRestart, envVars: project.envVars });

    // Log the live URL prominently at the end
    log(`[BeraPanel] ════════════════════════════════════════\n`);
    log(`[BeraPanel] ✅ DEPLOY SUCCESSFUL in ${duration}s\n`);
    log(`[BeraPanel] 🌐 Live URL: ${liveUrl}\n`);
    log(`[BeraPanel] ════════════════════════════════════════\n`);

    return liveUrl;
  } catch (err: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    log(`[BeraPanel] ❌ DEPLOY FAILED after ${duration}s: ${err.message}\n`);
    await db.update(projectsTable).set({ status: "error" }).where(eq(projectsTable.id, project.id));
    await db.update(deployHistoryTable).set({ status: "failed", buildLog, durationSeconds: duration }).where(eq(deployHistoryTable.id, deployId));
    throw err;
  }
}

export function getProjectDir(projectId: string): string {
  return path.join(PROJECTS_DIR, projectId);
}

export { PROJECTS_DIR };
