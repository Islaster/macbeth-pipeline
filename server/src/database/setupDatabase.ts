import { readFile } from "node:fs/promises";
import path from "node:path";
import { database } from "./database";

async function setupDatabase(): Promise<void> {
  const schema = await readFile(
    path.resolve("src/database/schema.sql"),
    "utf8"
  );
  await database.query(schema);
  console.log("Database tables are ready.");
}

setupDatabase()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void database.end());
