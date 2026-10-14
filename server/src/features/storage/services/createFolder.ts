import type { StoredFolder } from "../../../../../shared/types/storedFile";
import { driveClient, folderMimeType } from "../config/driveClient";
import { isValidFolderName, isValidFolderPath } from "../helpers/folderNames";
import { UploadError } from "../helpers/UploadError";
import { findFolderId, rememberFolderId } from "./drivePaths";
import { rememberNewFolder } from "./fileIndex";

interface NewFolderRequest {
  parent: string; // "" for the top level, otherwise ends with "/"
  name: string;
}

// Creates an empty folder in Drive and returns it the way listings describe folders.
export async function createFolder(
  request: NewFolderRequest
): Promise<StoredFolder> {
  const { parent, name } = request;
  if (!isValidFolderPath(parent))
    throw new UploadError(400, "Choose where to create the folder.");
  if (!isValidFolderName(name))
    throw new UploadError(400, "That folder name can't be used.");

  const parentId = await findFolderId(parent);
  if (!parentId) throw new UploadError(404, "That folder doesn't exist.");

  const path = `${parent}${name}/`;
  // Drive would happily make a second folder with the same name; this app's paths can't tell them apart.
  if (await findFolderId(path)) {
    throw new UploadError(409, `A folder called "${name}" is already there.`);
  }

  const response = await driveClient.files.create({
    requestBody: { name, mimeType: folderMimeType, parents: [parentId] },
    fields: "id",
    supportsAllDrives: true,
  });
  const id = response.data.id;
  if (!id) throw new Error("Drive didn't return the new folder's ID");

  rememberFolderId(path, id); // so uploads into it work straight away
  rememberNewFolder(path); // so folder search sees it before the next crawl
  return { path, name };
}
