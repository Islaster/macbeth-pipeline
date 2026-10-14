import type { drive_v3 } from "@googleapis/drive";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { driveClient } from "../config/driveClient";
import { storageConfig } from "../config/storageConfig";
import { findFile } from "./drivePaths";
import { fetchDriveThumbnail } from "./fetchDriveThumbnail";

const cacheFolder = path.resolve(storageConfig.thumbnailCacheFolder);

function canMakeThumbnail(key: string): boolean {
  const extension = key.split(".").pop()?.toLowerCase() ?? "";
  return storageConfig.thumbnailExtensions.includes(extension);
}

// One saved thumbnail per file version, so an updated file gets a fresh one.
function cachePathFor(key: string, version: string): string {
  const name = createHash("sha256").update(`${key}\n${version}`).digest("hex");
  return path.join(cacheFolder, `${name}.webp`);
}

async function readSavedThumbnail(cachePath: string): Promise<Buffer | null> {
  try {
    return await readFile(cachePath);
  } catch {
    return null; // not made yet
  }
}

async function downloadOriginal(
  file: drive_v3.Schema$File
): Promise<Buffer | null> {
  if (!file.id) return null;
  if (Number(file.size ?? 0) > storageConfig.thumbnailMaxSourceBytes)
    return null;

  const response = await driveClient.files.get(
    { fileId: file.id, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(response.data as ArrayBuffer);
}

async function createThumbnail(key: string): Promise<Buffer | null> {
  const file = await findFile(key, "id,name,size,thumbnailLink");
  if (!file) return null;

  // Drive's ready-made preview is a tiny download; the original is the fallback.
  const source =
    (await fetchDriveThumbnail(file.thumbnailLink)) ??
    (await downloadOriginal(file));
  if (!source) return null;

  return sharp(source)
    .resize({
      width: storageConfig.thumbnailSizePx,
      height: storageConfig.thumbnailSizePx,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 75 })
    .toBuffer();
}

// Returns a small preview of an image file, or null when one can't be made.
// The first request fetches and shrinks it; later ones read the saved copy.
export async function getFileThumbnail(
  key: string,
  version: string
): Promise<Buffer | null> {
  if (!canMakeThumbnail(key)) return null;

  const cachePath = cachePathFor(key, version);
  const saved = await readSavedThumbnail(cachePath);
  if (saved) return saved;

  const thumbnail = await createThumbnail(key);
  if (thumbnail) {
    await mkdir(cacheFolder, { recursive: true });
    await writeFile(cachePath, thumbnail);
  }
  return thumbnail;
}
