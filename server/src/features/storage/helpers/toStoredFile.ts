import type { drive_v3 } from "@googleapis/drive";
import type { StoredFile } from "../../../../../shared/types/storedFile";
import { storageConfig } from "../config/storageConfig";

// The details every listing asks Drive for.
export const storedFileFields = "id,name,mimeType,size,modifiedTime,parents";

export function lastPathSegment(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? "";
}

// Returns null for entries that aren't real files: placeholders, shortcuts,
// and Google Docs/Sheets/Slides, which have no file content to download.
export function toStoredFile(
  file: drive_v3.Schema$File,
  folderPath: string // "" for the root, otherwise ends with "/"
): StoredFile | null {
  const name = file.name;
  if (!name || isHiddenFile(name)) return null;
  if (file.mimeType?.startsWith("application/vnd.google-apps.")) return null;

  return {
    key: `${folderPath}${name}`,
    name,
    sizeBytes: Number(file.size ?? 0),
    lastModified: file.modifiedTime ?? "",
  };
}

function isHiddenFile(name: string): boolean {
  return (
    storageConfig.hiddenFileNames.includes(name) ||
    storageConfig.hiddenFilePrefixes.some((prefix) => name.startsWith(prefix))
  );
}
