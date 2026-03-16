import express, { type Express } from "express";
import cors from "cors";
import morgan from "morgan";
import router from "./routes/index.js";
import { createProxyMiddleware, responseInterceptor } from "http-proxy-middleware";
import { db } from "@workspace/db";
import { projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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
    if (!project || !project.port || project.status !== "running") {
      res.status(503).send(`
        <html><body style="background:#0a0a0f;color:#fff;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px">
          <h1 style="color:#6366f1">BeraPanel</h1>
          <p>Project <b>${project?.name || projectId}</b> is currently <b>${project?.status || "not found"}</b></p>
          <p style="color:#888">Start or deploy your project to make it live.</p>
        </body></html>
      `);
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

          // Only rewrite HTML responses
          if (!contentType.includes("text/html")) {
            return responseBuffer;
          }

          let html = responseBuffer.toString("utf8");

          // Rewrite root-relative URLs (starting with /) but not protocol-relative (//)
          // Covers: href="/path", src="/path", action="/path", fetch('/path'), axios.get('/path')
          html = html.replace(
            /(['"`])\/((?!\/)[^'"`\s>]*)/g,
            `$1${base}/$2`
          );

          // Fix CSS url(/path) patterns
          html = html.replace(
            /url\(\/((?!\/)[^)]*)\)/g,
            `url(${base}/$1)`
          );

          return Buffer.from(html, "utf8");
        }),
        error: (err: any, req: any, res: any) => {
          if (!res.headersSent) {
            res.status(502).send("Project is starting up... Please wait.");
          }
        },
      },
    });
    return proxy(req, res, next);
  } catch {
    res.status(500).json({ error: "Proxy error" });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

export default app;
