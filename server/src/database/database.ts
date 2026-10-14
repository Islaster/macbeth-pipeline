import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString)
  throw new Error("Missing environment variable: DATABASE_URL");

export const database = new Pool({ connectionString });
