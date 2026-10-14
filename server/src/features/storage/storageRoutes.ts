import { Router } from "express";
import { getFileDownloadUrl } from "./services/getFileDownloadUrl";
import { listFileVersions } from "./services/listFileVersions";
import { listStoredFiles } from "./services/listStoredFiles";
import { searchFiles } from "./services/searchFiles";
import { searchFolders } from "./services/searchFolders";
import { getFileThumbnail } from "./services/getFileThumbnail";
import type { AssetType } from "../../../../shared/types/storedFile";
import { UploadError } from "./helpers/UploadError";
import { createUploadUrl } from "./services/createUploadUrl";
import { readDownloadToken } from "./helpers/downloadToken";
import { getSignedInUser } from "../auth/helpers/signedInUser";
import { requireSignedIn } from "../auth/middleware/requireSignedIn";
import { streamFileDownload } from "./services/streamFileDownload";
import { createFolder } from "./services/createFolder";

function readQueryString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export const storageRoutes = Router();

// GET /api/storage/files?folder=scenes/&cursor=...
storageRoutes.get("/files", async (req, res) => {
  const page = await listStoredFiles({
    folder: readQueryString(req.query.folder),
    cursor: readQueryString(req.query.cursor),
  });
  res.json(page);
});

// GET /api/storage/versions?key=scenes/intro/cut.mp4
storageRoutes.get("/versions", async (req, res) => {
  const key = readQueryString(req.query.key);
  if (!key) return res.status(400).json({ error: "key is required" });
  res.json(await listFileVersions(key));
});

// GET /api/storage/download-url?key=...&versionId=...&save=1  (save=1: download instead of open)
storageRoutes.get("/download-url", async (req, res) => {
  const key = readQueryString(req.query.key);
  if (!key) return res.status(400).json({ error: "key is required" });
  const url = await getFileDownloadUrl(key, {
    versionId: readQueryString(req.query.versionId),
    asAttachment: req.query.save === "1",
  });
  if (!url) return res.status(404).json({ error: "File not found" });
  res.json({ url });
});

// GET /api/storage/download?token=...  (the link handed out by /download-url)
storageRoutes.get("/download", async (req, res) => {
  const link = readDownloadToken(readQueryString(req.query.token));
  if (!link) {
    res.status(403).json({ error: "This download link has expired." });
    return;
  }
  await streamFileDownload(link, req.headers.range, res);
});

// GET /api/storage/search?q=lay&target=files&within=Scene_Bin/006_(HKA)_HONG_KONG_ATTACK/
storageRoutes.get("/search", (req, res) => {
  const query = readQueryString(req.query.q) ?? "";
  const withinFolder = readQueryString(req.query.within);

  if (readQueryString(req.query.target) === "folders") {
    res.json(searchFolders(query, withinFolder));
    return;
  }

  res.json(
    searchFiles(query, {
      withinFolder,
      assetType: readAssetType(req.query.assetType),
    })
  );
});

storageRoutes.get("/thumbnail", async (req, res) => {
  const key = readQueryString(req.query.key);
  if (!key) {
    res.status(400).json({ error: "key is required" });
    return;
  }

  const version = readQueryString(req.query.v) ?? "";
  const thumbnail = await getFileThumbnail(key, version).catch(() => null);
  if (!thumbnail) {
    res.status(404).end();
    return;
  }

  res.set("Content-Type", "image/webp");
  // The address changes whenever the file does, so browsers can keep this for good.
  res.set("Cache-Control", "private, max-age=31536000, immutable");
  res.send(thumbnail);
});

// POST /api/storage/upload-url  { folder, fileName, sizeBytes }  -> signed-in people only
storageRoutes.post("/upload-url", requireSignedIn, async (req, res) => {
  const artist = getSignedInUser(res).name.trim();
  if (!artist) {
    res.status(400).json({ error: "Your account has no name set." });
    return;
  }

  try {
    res.json(
      await createUploadUrl({
        folder: readQueryString(req.body?.folder) ?? "",
        fileName: readQueryString(req.body?.fileName) ?? "",
        sizeBytes: Number(req.body?.sizeBytes) || 0,
        origin: req.get("origin"),
        artist,
      })
    );
  } catch (error) {
    if (!(error instanceof UploadError)) throw error;
    res.status(error.status).json({ error: error.message, code: error.code });
  }
});

//HELPER FUNCTIONS
function readAssetType(value: unknown): AssetType | undefined {
  return value === "characterSheets" || value === "props" ? value : undefined;
}

// POST /api/storage/folders  { parent, name }  -> signed-in people only
storageRoutes.post("/folders", requireSignedIn, async (req, res) => {
  try {
    res.status(201).json(
      await createFolder({
        parent: readQueryString(req.body?.parent) ?? "",
        name: readQueryString(req.body?.name)?.trim() ?? "",
      })
    );
  } catch (error) {
    if (!(error instanceof UploadError)) throw error;
    res.status(error.status).json({ error: error.message });
  }
});
