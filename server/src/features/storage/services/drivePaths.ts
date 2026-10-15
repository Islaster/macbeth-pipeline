import type { drive_v3 } from "@googleapis/drive";
import {
  driveClient,
  folderMimeType,
  sharedDriveOptions,
} from "../config/driveClient";
import { storageConfig } from "../config/storageConfig";

// Drive finds things by ID, the app by path ("Assets/Characters/sheet.png").
// This file turns paths into IDs, remembering folders so each is looked up once.
const folderIds = new Map<string, Promise<string | null>>();
const folderPathsById = new Map<string, string>([
  [storageConfig.rootFolderId, ""],
]);
const fileKeysById = new Map<string, string>();

function escapeForQuery(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findChild(
  parentId: string,
  name: string,
  kind: "folder" | "file",
  fields = "id,name"
): Promise<drive_v3.Schema$File | null> {
  const typeFilter = `mimeType ${
    kind === "folder" ? "=" : "!="
  } '${folderMimeType}'`;
  const response = await driveClient.files.list({
    q: `'${parentId}' in parents and name = '${escapeForQuery(
      name
    )}' and ${typeFilter} and trashed = false`,
    fields: `files(${fields})`,
    orderBy: "modifiedTime desc", // Drive allows same-named items; the newest wins
    ...sharedDriveOptions,
  });
  // Drive's name match ignores upper/lower case, so check for the exact name.
  return response.data.files?.find((file) => file.name === name) ?? null;
}

async function lookUpFolderId(segments: string[]): Promise<string | null> {
  const parentId = await findFolderId(segments.slice(0, -1).join("/"));
  if (!parentId) return null;
  const folder = await findChild(parentId, segments.at(-1) ?? "", "folder");
  return folder?.id ?? null;
}

// "Assets/Characters/" -> that folder's Drive ID, or null when it doesn't exist.
export function findFolderId(folderPath = ""): Promise<string | null> {
  const segments = folderPath.split("/").filter(Boolean);
  if (segments.length === 0) return Promise.resolve(storageConfig.rootFolderId);

  const path = `${segments.join("/")}/`;
  const remembered = folderIds.get(path);
  if (remembered) return remembered;

  const lookup = lookUpFolderId(segments);
  folderIds.set(path, lookup);
  const forget = () => folderIds.delete(path);
  lookup.then((id) => !id && forget(), forget); // don't remember misses or failures
  return lookup;
}

// "Assets/Characters/sheet.png" -> that file's Drive details, or null when it doesn't exist.
export async function findFile(
  key: string,
  fields = "id,name"
): Promise<drive_v3.Schema$File | null> {
  const slashIndex = key.lastIndexOf("/");
  const folderId = await findFolderId(key.slice(0, slashIndex + 1));
  if (!folderId) return null;
  return findChild(folderId, key.slice(slashIndex + 1), "file", fields);
}

// For a folder this app just created.
export function rememberFolderId(path: string, id: string): void {
  folderIds.set(path, Promise.resolve(id));
  folderPathsById.set(id, path);
}

// Called after each full crawl, so renamed or moved folders are picked up.
export function rememberFolderIds(idsByPath: Map<string, string>): void {
  folderIds.clear();
  folderPathsById.clear();
  folderPathsById.set(storageConfig.rootFolderId, "");
  for (const [path, id] of idsByPath) {
    folderIds.set(path, Promise.resolve(id));
    folderPathsById.set(id, path);
  }
}

export function rememberFileIds(idsByKey: Map<string, string>): void {
  fileKeysById.clear();
  for (const [key, id] of idsByKey) fileKeysById.set(id, key);
}

// Drive ID -> this app's folder path ("" for the root), or null when it isn't in our tree.
export function findFolderPath(folderId: string): string | null {
  return folderPathsById.get(folderId) ?? null;
}

// Drive ID -> this app's file key, or null when the file isn't known.
export function findFileKey(fileId: string): string | null {
  return fileKeysById.get(fileId) ?? null;
}
