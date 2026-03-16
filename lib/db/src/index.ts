import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

function getConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
  if (PGHOST && PGUSER && PGDATABASE) {
    const pass = PGPASSWORD ? `:${encodeURIComponent(PGPASSWORD)}` : "";
    const port = PGPORT ? `:${PGPORT}` : ":5432";
    return `postgresql://${PGUSER}${pass}@${PGHOST}${port}/${PGDATABASE}`;
  }
  throw new Error(
    "No database connection configured. Set DATABASE_URL or PGHOST/PGUSER/PGDATABASE environment variables.",
  );
}

export const pool = new Pool({ connectionString: getConnectionString() });
export const db = drizzle(pool, { schema });

export * from "./schema";
