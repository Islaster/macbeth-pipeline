import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  StoredFile,
  StoredFolder,
} from "../../../../../shared/types/storedFile";
import { storageConfig } from "../config/storageConfig";

export interface BucketContents {
  files: StoredFile[];
  folders: StoredFolder[];
}

const cachePath = path.resolve(storageConfig.fileIndexCachePath);

// Returns null when no index has been saved yet, or it can't be read.
export async function loadCachedIndex(): Promise<BucketContents | null> {
  try {
    return JSON.parse(await readFile(cachePath, "utf8")) as BucketContents;
  } catch {
    return null;
  }
}

export async function saveCachedIndex(contents: BucketContents): Promise<void> {
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, JSON.stringify(contents));
}
