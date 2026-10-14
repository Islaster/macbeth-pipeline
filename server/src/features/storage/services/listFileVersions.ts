import type { StoredFileVersion } from "../../../../../shared/types/storedFile";
import { driveClient } from "../config/driveClient";
import { findFile } from "./drivePaths";

// Drive calls versions "revisions" and lists them oldest first.
export async function listFileVersions(
  key: string
): Promise<StoredFileVersion[]> {
  const file = await findFile(key);
  if (!file?.id) return [];

  const response = await driveClient.revisions.list({
    fileId: file.id,
    fields: "revisions(id,size,modifiedTime)",
    pageSize: 1000,
  });

  return (response.data.revisions ?? [])
    .reverse() // newest first, as before
    .map((revision, index) => ({
      versionId: revision.id ?? "",
      sizeBytes: Number(revision.size ?? 0),
      lastModified: revision.modifiedTime ?? "",
      isLatest: index === 0,
    }));
}
