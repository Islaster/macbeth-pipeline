import { storageConfig } from "../config/storageConfig";
import { crawlDrive } from "./crawlDrive";
import { rememberFolderIds } from "./drivePaths";
import {
  loadCachedIndex,
  saveCachedIndex,
  type BucketContents,
} from "./fileIndexCache";
import { lastPathSegment } from "../helpers/toStoredFile";

let indexed: BucketContents = { files: [], folders: [] };
let isReady = false;
let isRefreshing = false;

export async function refreshFileIndex(): Promise<void> {
  if (isRefreshing) return;
  isRefreshing = true;
  try {
    const crawl = await crawlDrive();
    indexed = crawl.contents;
    isReady = true;
    rememberFolderIds(crawl.folderIds);
    console.log(
      `File index ready: ${indexed.files.length} files, ${indexed.folders.length} folders`
    );
    await saveCachedIndex(indexed);
  } finally {
    isRefreshing = false;
  }
}

// Uses the last saved index right away, then updates it from Drive in the background.
export function startFileIndexRefresh(): void {
  const refresh = () => {
    refreshFileIndex().catch((error: unknown) => {
      console.error("File index refresh failed:", error);
    });
  };

  void loadCachedIndex()
    .then((cached) => {
      if (cached && !isReady) {
        indexed = cached;
        isReady = true;
        console.log(
          `File index loaded from disk: ${cached.files.length} files`
        );
      }
    })
    .finally(refresh);

  setInterval(refresh, storageConfig.fileIndexRefreshMinutes * 60_000);
}

export function getFileIndex(): BucketContents & { isReady: boolean } {
  return { ...indexed, isReady };
}

// Adds a folder this app just created, without waiting for the next crawl.
export function rememberNewFolder(path: string): void {
  if (indexed.folders.some((folder) => folder.path === path)) return;
  const folders = [...indexed.folders, { path, name: lastPathSegment(path) }];
  folders.sort((a, b) => (a.path < b.path ? -1 : 1));
  indexed = { ...indexed, folders };
}
