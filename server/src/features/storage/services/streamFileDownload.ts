import type { Response } from "express";
import { pipeline } from "node:stream/promises";
import { driveClient } from "../config/driveClient";
import type { DownloadLink } from "../helpers/downloadToken";
import { readHeader } from "../helpers/readHeader";

const passedThroughHeaders = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
];

// encodeURIComponent leaves a few characters that aren't allowed in this header.
function encodeFileName(name: string): string {
  return encodeURIComponent(name).replace(
    /['()*!]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

// Sends a file (or one of its older versions) from Drive straight to the browser.
// The Range header is passed along so videos can be scrubbed without a full download.
export async function streamFileDownload(
  link: DownloadLink,
  range: string | undefined,
  res: Response
): Promise<void> {
  const headers: Record<string, string> = range ? { Range: range } : {};
  const requestOptions = { responseType: "stream" as const, headers };
  const driveResponse = link.revisionId
    ? await driveClient.revisions.get(
        { fileId: link.fileId, revisionId: link.revisionId, alt: "media" },
        requestOptions
      )
    : await driveClient.files.get(
        { fileId: link.fileId, alt: "media", supportsAllDrives: true },
        requestOptions
      );

  res.status(driveResponse.status);
  for (const header of passedThroughHeaders) {
    const value = readHeader(driveResponse.headers, header);
    if (value) res.set(header, value);
  }
  const disposition = link.asAttachment ? "attachment" : "inline";
  res.set(
    "Content-Disposition",
    `${disposition}; filename*=UTF-8''${encodeFileName(link.name)}`
  );

  // A closed tab or cancelled download ends the stream early; that isn't an error.
  await pipeline(driveResponse.data, res).catch(() => res.destroy());
}
