import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

const schemaPath = path.resolve("src/database/schema.sql"); // relative to server/

// Creates any missing tables. schema.sql only uses IF NOT EXISTS, so running it on every start is safe.
export async function applySchema(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(await readFile(schemaPath, "utf8"));
    console.log("Database tables are in place");
  } finally {
    await pool.end();
  }
}
