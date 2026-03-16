import path from "path";
import { fileURLToPath } from "url";
import { build as esbuild } from "esbuild";
import { rm, readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Packages that are bundled INTO the CJS output.
// Anything NOT in this list (and not a workspace:* dep) becomes an external
// require() call that must exist in node_modules at production runtime.
// To eliminate all runtime dependency risk, bundle everything that is
// pure-JS or known to be esbuild-compatible.
const allowlist = [
  // ---- already bundled ----
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
  // ---- newly bundled (were external → caused production crashes) ----
  "adm-zip",
  "bcryptjs",
  "cookie-parser",
  "helmet",
  "http-proxy-middleware",
  "morgan",
  "node-cron",
  "systeminformation",
];

// Safety-net banner: registers uncaughtException / unhandledRejection handlers
// at the very top of the bundle, BEFORE any module initialisation code runs,
// so every startup crash is logged with a full stack trace instead of
// producing a silent exit-1 with minified source printed to stderr.
const errorBanner = `
process.on('uncaughtException', function(err) {
  process.stderr.write('[FATAL] Uncaught Exception: ' + err.message + '\\n');
  if (err.stack) process.stderr.write(err.stack + '\\n');
  process.exit(1);
});
process.on('unhandledRejection', function(reason) {
  var msg = reason && reason.stack ? reason.stack : String(reason);
  process.stderr.write('[FATAL] Unhandled Rejection: ' + msg + '\\n');
});
`.trim();

async function buildAll() {
  const distDir = path.resolve(__dirname, "dist");
  await rm(distDir, { recursive: true, force: true });

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

  console.log("External (not bundled):", externals);

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
    // Inject the crash-logging banner at the very top of the bundle
    banner: { js: errorBanner },
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
