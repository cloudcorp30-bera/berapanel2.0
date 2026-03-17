import app from "./app";
import { db } from "@workspace/db";
import { projectsTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { startProcess, getProjectDir } from "./lib/process-manager.js";
import { runSeed } from "./lib/seed.js";
import fs from "fs";

// Global safety net — log uncaught errors instead of crashing silently
process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught exception:", err.message);
  console.error(err.stack);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] Unhandled rejection:", reason);
});

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  // Seed default data (bot templates, coin packages) — safe to run every startup (upsert)
  runSeed().catch((e) => console.error("[seed] failed:", e));
  // Auto-recover projects that were running before server restart
  autoRecoverProjects();
});

async function autoRecoverProjects() {
  try {
    const runningProjects = await db.select().from(projectsTable)
      .where(or(eq(projectsTable.status, "running"), eq(projectsTable.autoRestart, true)));

    const toRestart = runningProjects.filter(p => {
      if (!p.port || !p.startCommand) return false;
      const dir = getProjectDir(p.id);
      return fs.existsSync(dir) && fs.readdirSync(dir).length > 0;
    });

    if (toRestart.length === 0) return;

    console.log(`[AutoRecover] Restarting ${toRestart.length} project(s)...`);
    for (const project of toRestart) {
      try {
        await startProcess({
          id: project.id,
          startCommand: project.startCommand!,
          envVars: project.envVars as Record<string, string> | null,
          port: project.port!,
          autoRestart: project.autoRestart ?? false,
        });
        console.log(`[AutoRecover] ✅ ${project.name} restarted on port ${project.port}`);
      } catch (err: any) {
        console.error(`[AutoRecover] ❌ ${project.name} failed: ${err.message}`);
        await db.update(projectsTable).set({ status: "error" }).where(eq(projectsTable.id, project.id));
      }
    }
  } catch (err: any) {
    console.error("[AutoRecover] Failed:", err.message);
  }
}
