import type { drive_v3 } from "@googleapis/drive";
import type { StoredFile } from "../../../../../shared/types/storedFile";
import {
  driveClient,
  folderMimeType,
  sharedDriveOptions,
} from "../config/driveClient";
import { storageConfig } from "../config/storageConfig";
import {
  lastPathSegment,
  storedFileFields,
  toStoredFile,
} from "../helpers/toStoredFile";
import type { BucketContents } from "./fileIndexCache";

export interface DriveCrawl {
  contents: BucketContents;
  folderIds: Map<string, string>; // folder path -> Drive ID
}

const foldersPerRequest = 40; // keeps the search text Drive receives short enough

async function listChildrenOf(
  folderIds: string[]
): Promise<drive_v3.Schema$File[]> {
  const inAnyFolder = folderIds.map((id) => `'${id}' in parents`).join(" or ");
  const children: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;

  do {
    const { data }: { data: drive_v3.Schema$FileList } =
      await driveClient.files.list({
        q: `(${inAnyFolder}) and trashed = false`,
        fields: `nextPageToken, files(${storedFileFields})`,
        pageSize: 1000,
        pageToken,
        ...sharedDriveOptions,
      });
    children.push(...(data.files ?? []));
    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);

  return children;
}

// Walks the whole folder tree one level at a time, asking about many folders per request.
export async function crawlDrive(): Promise<DriveCrawl> {
  const files: StoredFile[] = [];
  const folderIds = new Map<string, string>();
  const pathById = new Map([[storageConfig.rootFolderId, ""]]);
  let level = [storageConfig.rootFolderId];

  while (level.length > 0) {
    const nextLevel: string[] = [];

    for (let start = 0; start < level.length; start += foldersPerRequest) {
      const batch = level.slice(start, start + foldersPerRequest);

      for (const child of await listChildrenOf(batch)) {
        const parentId = child.parents?.find((id) => pathById.has(id));
        const parentPath = parentId ? pathById.get(parentId) : undefined;
        if (parentPath === undefined || !child.id || !child.name) continue;

        if (child.mimeType !== folderMimeType) {
          const file = toStoredFile(child, parentPath);
          if (file) files.push(file);
          continue;
        }

        const path = `${parentPath}${child.name}/`;
        if (folderIds.has(path)) continue; // a second folder with the same name
        folderIds.set(path, child.id);
        pathById.set(child.id, path);
        nextLevel.push(child.id);
      }
    }

    level = nextLevel;
  }

  const folders = [...folderIds.keys()]
    .sort()
    .map((path) => ({ path, name: lastPathSegment(path) }));

  return { contents: { files, folders }, folderIds };
}
