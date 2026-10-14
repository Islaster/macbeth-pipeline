import { useState } from "react";
import type { StoredFile } from "../../../../../shared/types/storedFile";
import { getThumbnailUrl } from "../api/storageApi";
import { getFileExtension, getFileKind } from "../helpers/fileNameDetails";

// Shows a small preview for images, and the file type for everything else.
export function FileThumbnail({ file }: { file: StoredFile }) {
  const [hasFailed, setHasFailed] = useState(false);

  if (getFileKind(file.name) !== "image" || hasFailed) {
    return (
      <span className="file-thumbnail file-thumbnail--placeholder">
        {getFileExtension(file.name) || "file"}
      </span>
    );
  }

  return (
    <img
      className="file-thumbnail"
      src={getThumbnailUrl(file)}
      alt=""
      loading="lazy" // only fetched once it scrolls into view
      onError={() => setHasFailed(true)}
    />
  );
}
