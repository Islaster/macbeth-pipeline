import type { DragEvent } from "react";
import type { StoredFile } from "../../../../../shared/types/storedFile";
import { prepareDownloadLink, readDownloadLink } from "./downloadLinks";
import { getFileExtension } from "./fileNameDetails";

const mimeTypeByExtension: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

// Spread these onto a file's row or tile so it can be dragged out of the browser
// and dropped on the desktop or into a folder. Works in Chrome and Edge; other
// browsers ignore the drop, and the Download button covers them.
export function getDraggableDownloadProps(file: StoredFile) {
  return {
    draggable: true,
    onPointerEnter: () => prepareDownloadLink(file.key),
    onDragStart: (event: DragEvent<HTMLElement>) => {
      const url = readDownloadLink(file.key);
      if (!url) {
        prepareDownloadLink(file.key); // ready for the next try
        return;
      }
      const absoluteUrl = new URL(url, window.location.origin).href;
      const mimeType =
        mimeTypeByExtension[getFileExtension(file.name)] ??
        "application/octet-stream";
      event.dataTransfer.setData(
        "DownloadURL",
        `${mimeType}:${file.name}:${absoluteUrl}`
      );
      event.dataTransfer.setData("text/uri-list", absoluteUrl);
      event.dataTransfer.effectAllowed = "copy";
    },
  };
}
