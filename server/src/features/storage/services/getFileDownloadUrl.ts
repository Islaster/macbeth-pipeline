import { storageConfig } from "../config/storageConfig";
import { createDownloadToken } from "../helpers/downloadToken";
import { findFile } from "./drivePaths";

// Drive has no temporary public links, so this returns a short-lived link to
// our own /download route, which passes the file through from Drive.
// Returns null when the file doesn't exist.
export async function getFileDownloadUrl(
  key: string,
  versionId?: string
): Promise<string | null> {
  const file = await findFile(key);
  if (!file?.id || !file.name) return null;

  const token = createDownloadToken({
    fileId: file.id,
    revisionId: versionId,
    name: file.name,
  });
  return `${storageConfig.routesBasePath}/download?token=${token}`;
}
