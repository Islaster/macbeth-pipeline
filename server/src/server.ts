import path from "node:path";
import express from "express";
import { app } from "./app";
import { applySchema } from "./database/applySchema";
import { database } from "./database/database"; // use whatever database.ts exports
import { exitCleanlyOnSignals } from "./exitCleanly";
import { startFileIndexRefresh } from "./features/storage/services/fileIndex";

const port = Number(process.env.PORT) || 3001;
const isProduction = process.env.NODE_ENV === "production";

// Hands out the built client and lets React handle page addresses.
// The path is relative to server/, like the cache paths.
function serveBuiltClient(): void {
  const clientDist = path.resolve("../client/dist");
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

async function start(): Promise<void> {
  app.set("trust proxy", 1); // Railway sits in front of the app
  if (isProduction) serveBuiltClient();

  await applySchema();
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  startFileIndexRefresh();
  exitCleanlyOnSignals(server, () => database.end());
}

start().catch((error: unknown) => {
  console.error("The server could not start:", error);
  process.exit(1);
});
