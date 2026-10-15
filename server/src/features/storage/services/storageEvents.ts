import type { Response } from "express";
import { storageConfig } from "../config/storageConfig";

// Live updates: every open browser keeps one connection to /api/storage/events,
// and the server writes a line to all of them whenever storage changes.

export type StorageEvent =
  | { type: "folders"; folders: string[] } // these folders' contents changed
  | { type: "all" } // something structural changed (a folder renamed or moved); reload everything
  | { type: "index" }; // the search index was rebuilt

const clients = new Set<Response>();

export function addEventClient(res: Response): void {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // tells proxies not to hold the stream back
  });
  res.flushHeaders();
  res.write(": connected\n\n");

  // A comment line now and then stops proxies closing an idle connection.
  const keepAlive = setInterval(() => {
    res.write(": ping\n\n");
  }, storageConfig.eventsKeepAliveSeconds * 1000);

  clients.add(res);
  res.on("close", () => {
    clearInterval(keepAlive);
    clients.delete(res);
  });
}

export function broadcastStorageEvent(event: StorageEvent): void {
  const line = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) client.write(line);
}
