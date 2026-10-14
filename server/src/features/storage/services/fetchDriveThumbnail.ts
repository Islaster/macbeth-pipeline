import { driveAuth } from "../config/driveClient";
import { storageConfig } from "../config/storageConfig";

// Drive makes its own small previews. Their links end in a size ("=s220"),
// which can be swapped for the size we want. Returns null when there's no
// preview or it can't be fetched.
export async function fetchDriveThumbnail(
  thumbnailLink?: string | null
): Promise<Buffer | null> {
  if (!thumbnailLink) return null;

  try {
    const response = await driveAuth.request<ArrayBuffer>({
      url: thumbnailLink.replace(/=s\d+$/, `=s${storageConfig.thumbnailSizePx}`),
      responseType: "arraybuffer",
    });
    return Buffer.from(response.data);
  } catch {
    return null;
  }
}
