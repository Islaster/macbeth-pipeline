import type {
  StoredFile,
  StoredFilePage,
  StoredFolder,
} from "../../../../../shared/types/storedFile";
import {
  driveClient,
  folderMimeType,
  sharedDriveOptions,
} from "../config/driveClient";
import { storedFileFields, toStoredFile } from "../helpers/toStoredFile";
import { findFolderId } from "./drivePaths";

interface ListStoredFilesOptions {
  folder?: string;
  cursor?: string;
  pageSize?: number;
}

function toFolderPath(folder?: string): string {
  if (!folder) return "";
  return folder.endsWith("/") ? folder : `${folder}/`;
}

// Lists one folder level: its subfolders and the files directly inside it.
export async function listStoredFiles(
  options: ListStoredFilesOptions = {}
): Promise<StoredFilePage> {
  const folderPath = toFolderPath(options.folder);
  const folderId = await findFolderId(folderPath);
  if (!folderId) return { folders: [], files: [], nextCursor: null };

  const response = await driveClient.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: `nextPageToken, files(${storedFileFields})`,
    orderBy: "folder,name", // subfolders first, then files, both A to Z
    pageToken: options.cursor,
    pageSize: options.pageSize ?? 100,
    ...sharedDriveOptions,
  });

  const folders: StoredFolder[] = [];
  const files: StoredFile[] = [];
  for (const item of response.data.files ?? []) {
    if (item.mimeType === folderMimeType) {
      if (item.name)
        folders.push({ path: `${folderPath}${item.name}/`, name: item.name });
      continue;
    }
    const file = toStoredFile(item, folderPath);
    if (file) files.push(file);
  }

  return { folders, files, nextCursor: response.data.nextPageToken ?? null };
}
