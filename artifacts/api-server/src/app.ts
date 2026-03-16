import express, { type Express } from "express";
import cors from "cors";
import morgan from "morgan";
import router from "./routes/index.js";
import { createProxyMiddleware, responseInterceptor } from "http-proxy-middleware";
import { db } from "@workspace/db";
import { projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";

const PROD_URL = "https://bruce-panel-1.replit.app";

const app: Express = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));

app.use("/api", router);

// Reverse proxy for deployed user projects at /app/:projectId/*
app.use("/app/:projectId", async (req, res, next) => {
  const { projectId } = req.params;
  try {
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId)).limit(1);

    if (!project) {
      res.status(404).send(notFoundPage(projectId, "not found"));
      return;
    }

    if (!project.port || project.status !== "running") {
      res.status(503).send(notFoundPage(project.name || projectId, project.status || "stopped", project.id));
      return;
    }

    const base = `/app/${projectId}`;

    const proxy = createProxyMiddleware({
      target: `http://localhost:${project.port}`,
      changeOrigin: true,
      selfHandleResponse: true,
      pathRewrite: { [`^/app/${projectId}`]: "" },
      on: {
        proxyRes: responseInterceptor(async (responseBuffer, proxyRes) => {
          const contentType = proxyRes.headers["content-type"] || "";

          if (!contentType.includes("text/html")) {
            return responseBuffer;
          }

          let html = responseBuffer.toString("utf8");

          // Rewrite root-relative URLs for the project's sub-path
          html = html.replace(
            /(['"`])\/((?!\/)[^'"`\s>]*)/g,
            `$1${base}/$2`
          );
          html = html.replace(
            /url\(\/((?!\/)[^)]*)\)/g,
            `url(${base}/$1)`
          );

          return Buffer.from(html, "utf8");
        }),
        error: (err: any, req: any, res: any) => {
          if (!res.headersSent) {
            res.status(502).send(startingUpPage(projectId));
          }
        },
      },
    });
    return proxy(req, res, next);
  } catch {
    res.status(500).json({ error: "Proxy error" });
  }
});

// Serve frontend static build in production
// process.cwd() is the monorepo root in both dev and production deployment
const staticPath = path.resolve(process.cwd(), "artifacts/berapanel/dist/public");
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
} else {
  // 404 handler for unknown API routes (dev mode)
  app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
  });
}

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

function notFoundPage(nameOrId: string, status: string, projectId?: string) {
  const panelUrl = `${PROD_URL}/projects${projectId ? `/${projectId}` : ""}`;
  const statusColor = status === "stopped" ? "#f59e0b" : status === "sleeping" ? "#6366f1" : "#ef4444";
  const statusText = status === "stopped" ? "⏹ Stopped" : status === "sleeping" ? "💤 Sleeping" : status === "idle" ? "⏸ Not Deployed" : `❌ ${status}`;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BeraPanel — ${nameOrId}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a0f;color:#fff;font-family:'Inter',system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.card{background:#111118;border:1px solid #2a2a3a;border-radius:20px;padding:48px 40px;max-width:480px;width:100%;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,.6)}
.logo{font-size:28px;font-weight:800;margin-bottom:24px;letter-spacing:-0.5px}.logo span{color:#6366f1}
.badge{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:99px;font-size:13px;font-weight:600;margin-bottom:20px;border:1px solid}
.name{font-size:20px;font-weight:700;margin-bottom:8px}.sub{color:#888;font-size:14px;line-height:1.5;margin-bottom:28px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;transition:opacity .2s}
.btn-primary{background:#6366f1;color:#fff}.btn-primary:hover{opacity:.85}
.footer{margin-top:32px;font-size:12px;color:#555}
</style></head>
<body>
<div class="card">
  <div class="logo">Bera<span>Panel</span></div>
  <div class="badge" style="color:${statusColor};border-color:${statusColor}33;background:${statusColor}11">${statusText}</div>
  <div class="name">${nameOrId}</div>
  <div class="sub">This project is currently <strong>${status}</strong>.<br>Deploy or start it from the panel to make it live.</div>
  ${projectId ? `<a href="${panelUrl}" class="btn btn-primary">▶ Go to Project Panel</a>` : `<a href="${PROD_URL}" class="btn btn-primary">🏠 Open BeraPanel</a>`}
  <div class="footer">Powered by BeraPanel 2.0</div>
</div>
</body></html>`;
}

function startingUpPage(projectId: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Starting Up…</title>
<meta http-equiv="refresh" content="5">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a0f;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh}
.card{text-align:center;padding:40px}.spinner{width:40px;height:40px;border:3px solid #6366f155;border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 24px}
@keyframes spin{to{transform:rotate(360deg)}}.title{font-size:20px;font-weight:700;margin-bottom:8px}.sub{color:#888;font-size:14px}</style></head>
<body><div class="card">
  <div class="spinner"></div>
  <div class="title">Project is starting up…</div>
  <div class="sub">Please wait. This page will refresh automatically.</div>
</div></body></html>`;
}

export default app;
