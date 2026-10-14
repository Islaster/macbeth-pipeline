import { driveAuth } from "../config/driveClient";
import { storageConfig } from "../config/storageConfig";
import { buildFileMetadata } from "../helpers/buildFileMetadata";
import { readHeader } from "../helpers/readHeader";
import { UploadError } from "../helpers/UploadError";
import { findFile, findFolderId } from "./drivePaths";
import { parseShotFileName } from "../helpers/parseShotFileName";

interface UploadRequest {
  folder: string; // e.g. "Assets/Characters/"
  fileName: string;
  sizeBytes: number;
  artist: string; // full name of the signed-in person
  origin?: string; // the website asking, e.g. "https://app.example.com"
}

const uploadApiUrl = "https://www.googleapis.com/upload/drive/v3/files";
// keepRevisionForever stops Drive clearing this version out after 30 days.
const uploadOptions =
  "uploadType=resumable&supportsAllDrives=true&keepRevisionForever=true";

function isValidFolder(folder: string): boolean {
  return (
    folder.endsWith("/") &&
    !folder.startsWith("/") &&
    !folder.includes("//") &&
    !folder.split("/").includes("..")
  );
}

function isValidFileName(fileName: string): boolean {
  return (
    fileName.length > 0 && fileName.length <= 255 && !/[\\/]/.test(fileName)
  );
}

// Asks Drive to open an upload and returns the address to send the file to.
// A new name creates a file; a name that's taken adds a new version on top of
// the existing file, and the older versions stay.
// The file's details (artist, seq_id, shot_id, stage) are set here, before any of the file is sent.
// Drive only lets a browser use that address from the website named when it was opened.
async function startDriveUpload(
  request: UploadRequest,
  folderId: string,
  existingFileId?: string
): Promise<string> {
  const properties = buildFileMetadata(request.artist, request.fileName);
  const response = await driveAuth.request({
    url: existingFileId
      ? `${uploadApiUrl}/${existingFileId}?${uploadOptions}`
      : `${uploadApiUrl}?${uploadOptions}`,
    method: existingFileId ? "PATCH" : "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...(request.origin ? { Origin: request.origin } : {}),
    },
    body: JSON.stringify(
      existingFileId
        ? { properties }
        : { name: request.fileName, parents: [folderId], properties }
    ),
  });

  const uploadUrl = readHeader(response.headers, "location");
  if (!uploadUrl) throw new Error("Drive didn't return an upload address");
  return uploadUrl;
}

// Returns a temporary link the browser can upload one file to (with a PUT, as before).
export async function createUploadUrl(request: UploadRequest): Promise<{
  uploadUrl: string;
  key: string;
  isNewVersion: boolean;
  artist: string;
}> {
  const { folder, fileName, sizeBytes } = request;

  if (!isValidFolder(folder))
    throw new UploadError(400, "Choose a folder to upload into.");
  if (!isValidFileName(fileName))
    throw new UploadError(400, "That file name can't be used.");
  if (!parseShotFileName(fileName)) {
    throw new UploadError(
      400,
      `"${fileName}" doesn't follow the naming convention.`,
      "naming"
    );
  }
  if (sizeBytes > storageConfig.maxUploadBytes) {
    throw new UploadError(400, "Files over 5 GB can't be uploaded here yet.");
  }

  const folderId = await findFolderId(folder);
  if (!folderId) throw new UploadError(404, "That folder doesn't exist.");

  const key = `${folder}${fileName}`;

  // Nothing is ever replaced: a name that's already taken gets a new version.
  const existingFileId = (await findFile(key))?.id ?? undefined;

  return {
    uploadUrl: await startDriveUpload(request, folderId, existingFileId),
    key,
    isNewVersion: existingFileId !== undefined,
    artist: request.artist,
  };
}
