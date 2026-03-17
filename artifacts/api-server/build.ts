import path from "path";
import { fileURLToPath } from "url";
import { build as esbuild } from "esbuild";
import { rm, readFile, cp } from "fs/promises";
import { existsSync } from "fs";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times without risking some
// packages that are not bundle compatible
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "http-proxy-middleware",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  const distDir = path.resolve(__dirname, "dist");
  await rm(distDir, { recursive: true, force: true });

  // Build the berapanel frontend first (so it can be copied into dist/public)
  const workspaceRoot = path.resolve(__dirname, "../..");
  console.log("building frontend (berapanel)...");
  execSync("pnpm --filter @workspace/berapanel run build", {
    cwd: workspaceRoot,
    stdio: "inherit",
  });

  console.log("building server...");
  const pkgPath = path.resolve(__dirname, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter(
    (dep) =>
      !allowlist.includes(dep) &&
      !(pkg.dependencies?.[dep]?.startsWith("workspace:")),
  );

  await esbuild({
    entryPoints: [path.resolve(__dirname, "src/index.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: path.resolve(distDir, "index.cjs"),
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  // Copy built frontend into dist/public so the API server can serve it
  const frontendDist = path.resolve(__dirname, "../berapanel/dist/public");
  const publicOut = path.resolve(distDir, "public");
  if (existsSync(frontendDist)) {
    console.log("copying frontend build to dist/public...");
    await cp(frontendDist, publicOut, { recursive: true });
    console.log("frontend copied.");
  } else {
    console.warn("WARNING: berapanel dist not found - build berapanel first");
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
