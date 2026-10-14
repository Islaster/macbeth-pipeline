import type { Server } from "node:http";

const forceExitAfterMs = 2000;

// On Ctrl-C (and Railway's stop signal): stop taking requests, give in-flight
// ones a moment, run the clean-up, and exit. Never hangs, whatever is still open.
export function exitCleanlyOnSignals(
  server: Server,
  cleanUp: () => Promise<unknown>
): void {
  const stop = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    setTimeout(() => process.exit(1), forceExitAfterMs).unref();
    server.close(() => {
      cleanUp()
        .catch(() => undefined)
        .finally(() => process.exit(0));
    });
    server.closeAllConnections(); // browser keep-alive connections would otherwise block close()
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}
