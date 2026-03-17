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
  project: { id: string; repoUrl: string | null; branch: string; installCommand: string; startCommand: string; buildCommand: string | null; envVars: Record<string, string> | null; port: number | null; autoRestart: boolean },
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
    log(`[BeraPanel] Deploying from ${repoUrl} (branch: ${project.branch})\n`);

    const runCmd = (cmd: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const proc = spawn("sh", ["-c", cmd], { cwd: dir, stdio: ["pipe", "pipe", "pipe"] });
        proc.stdout?.on("data", (d: Buffer) => log(d.toString()));
        proc.stderr?.on("data", (d: Buffer) => log(d.toString()));
        proc.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`Exit ${code}`))));
      });
    };

    if (fs.existsSync(path.join(dir, ".git"))) {
      await runCmd(`git fetch origin && git checkout ${project.branch} && git pull origin ${project.branch}`);
    } else {
      await runCmd(`git clone --depth 1 --branch ${project.branch} ${repoUrl} .`);
    }

    await runCmd(project.installCommand);
    if (project.buildCommand) await runCmd(project.buildCommand);

    const replitDomain = process.env.REPLIT_DOMAINS?.split(",")[0];
    const liveUrl = replitDomain
      ? `https://${replitDomain}/app/${project.id}`
      : `${process.env.BASE_URL || "http://localhost"}:${port}`;
    const duration = Math.floor((Date.now() - startTime) / 1000);

    await db.update(projectsTable).set({
      status: "running",
      port,
      liveUrl,
      lastDeployedAt: new Date(),
      deployCount: (project as any).deployCount ? (project as any).deployCount + 1 : 1,
    }).where(eq(projectsTable.id, project.id));

    await db.update(deployHistoryTable).set({ status: "success", buildLog, durationSeconds: duration }).where(eq(deployHistoryTable.id, deployId));

    await startProcess({ ...project, port, autoRestart: project.autoRestart });
    return liveUrl;
  } catch (err: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    await db.update(projectsTable).set({ status: "error" }).where(eq(projectsTable.id, project.id));
    await db.update(deployHistoryTable).set({ status: "failed", buildLog, durationSeconds: duration }).where(eq(deployHistoryTable.id, deployId));
    throw err;
  }
}

export function getProjectDir(projectId: string): string {
  return path.join(PROJECTS_DIR, projectId);
}

export { PROJECTS_DIR };
