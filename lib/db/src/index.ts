import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Build the connection string from whatever the environment provides.
// Never throw at module load time — let the first query surface any error.
function getConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Replit autoscale exposes individual PG* vars; PGHOST may be "helium"
  // (internal dev) or connectors.replit.com (production connector).
  const host =
    process.env.PGHOST ||
    process.env.CONNECTORS_HOSTNAME ||
    process.env.REPLIT_CONNECTORS_HOSTNAME;

  const { PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;

  if (host && PGUSER && PGDATABASE) {
    const pass = PGPASSWORD ? `:${encodeURIComponent(PGPASSWORD)}` : "";
    const port = PGPORT ? `:${PGPORT}` : ":5432";
    return `postgresql://${PGUSER}${pass}@${host}${port}/${PGDATABASE}`;
  }

  // Nothing available — return empty so Pool is created but fails on first query,
  // giving a clean error in the logs instead of crashing the whole process.
  console.warn(
    "[db] WARNING: No database connection configured. " +
    "Set DATABASE_URL (or PGHOST/PGUSER/PGDATABASE) in Deployment Secrets.",
  );
  return "";
}

function buildPoolConfig(): pg.PoolConfig {
  const connectionString = getConnectionString();
  const config: pg.PoolConfig = {
    connectionString,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  };
  if (connectionString) {
    const hasExplicitSsl = /[?&]sslmode=/.test(connectionString);
    if (!hasExplicitSsl) {
      config.ssl = { rejectUnauthorized: false };
    }
  }
  return config;
}

export const pool = new Pool(buildPoolConfig());

pool.on("error", (err) => {
  console.error("[db] Pool client error (connection was reset by server):", err.message);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
