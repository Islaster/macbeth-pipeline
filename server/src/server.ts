import { app } from "./app";
import { startFileIndexRefresh } from "./features/storage/services/fileIndex";
import path from "node:path";
import * as express from "express";

const port = Number(process.env.PORT ?? 3001);
app.set("trust proxy", 1);

if (process.env.NODE_ENV === "production") {
  // Hands out the built client, and lets React handle page addresses. Relative to server/, like the cache paths.
  const clientDist = path.resolve("../client/dist");
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Pipeline API running at http://localhost:${port}`);
  startFileIndexRefresh();
});
