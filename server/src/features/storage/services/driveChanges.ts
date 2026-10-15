import type { drive_v3 } from "@googleapis/drive";
import { driveClient, folderMimeType } from "../config/driveClient";
import { storageConfig } from "../config/storageConfig";
import { findFileKey, findFolderPath } from "./drivePaths";
import { scheduleFileIndexRefresh } from "./fileIndex";
import { broadcastStorageEvent } from "./storageEvents";

// Drive keeps a feed of everything that changed since a given point. Polling it
// catches changes made outside this app, such as files dropped straight into Drive.

let pageToken: string | null = null;

function folderOfKey(key: string): string {
  return key.slice(0, key.lastIndexOf("/") + 1);
}

// The folders whose listings a change affects, or "all" when paths may have changed.
function affectedFolders(
  change: drive_v3.Schema$Change
): string[] | "all" | null {
  const file = change.file;
  const knownKey = change.fileId ? findFileKey(change.fileId) : null;
  const knownFolderPath = change.fileId ? findFolderPath(change.fileId) : null;

  if (knownFolderPath !== null || file?.mimeType === folderMimeType) {
    // A folder appeared, moved, was renamed or removed: paths underneath may have changed.
    const parents = (file?.parents ?? []).map(findFolderPath);
    return knownFolderPath !== null || parents.some((path) => path !== null)
      ? "all"
      : null;
  }

  const folders = new Set<string>();
  if (knownKey) folders.add(folderOfKey(knownKey)); // where it was
  for (const parentId of file?.parents ?? []) {
    const path = findFolderPath(parentId);
    if (path !== null) folders.add(path); // where it is now
  }
  return folders.size > 0 ? [...folders] : null;
}

async function pollChanges(): Promise<void> {
  if (!pageToken) {
    const start = await driveClient.changes.getStartPageToken({
      supportsAllDrives: true,
    });
    pageToken = start.data.startPageToken ?? null;
    return; // nothing to compare against yet
  }

  const folders = new Set<string>();
  let reloadEverything = false;
  let token: string | null = pageToken;

  while (token) {
    const response: { data: drive_v3.Schema$ChangeList } =
      await driveClient.changes.list({
        pageToken: token,
        pageSize: 500,
        includeRemoved: true,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        fields:
          "nextPageToken,newStartPageToken,changes(fileId,removed,file(id,mimeType,parents,trashed))",
      });
    for (const change of response.data.changes ?? []) {
      const affected = affectedFolders(change);
      if (affected === "all") reloadEverything = true;
      else for (const folder of affected ?? []) folders.add(folder);
    }
    token = response.data.nextPageToken ?? null;
    if (response.data.newStartPageToken)
      pageToken = response.data.newStartPageToken;
  }

  if (reloadEverything) broadcastStorageEvent({ type: "all" });
  else if (folders.size > 0)
    broadcastStorageEvent({ type: "folders", folders: [...folders] });
  if (reloadEverything || folders.size > 0) scheduleFileIndexRefresh();
}

export function startDriveChangeWatch(): void {
  const poll = () => {
    pollChanges().catch((error: unknown) => {
      console.error("Checking Drive for changes failed:", error);
    });
  };
  poll();
  setInterval(poll, storageConfig.driveChangesPollSeconds * 1000);
}
