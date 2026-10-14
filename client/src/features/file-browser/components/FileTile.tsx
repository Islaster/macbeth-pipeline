import type { StoredFile } from "../../../../../shared/types/storedFile";
import { getFolderPath, getVersionLabel } from "../helpers/fileNameDetails";
import { formatFileSize } from "../helpers/formatFileSize";
import { FileThumbnail } from "./FileThumbnail";

interface FileTileProps {
  file: StoredFile;
  isSelected: boolean;
  onSelect: (file: StoredFile) => void;
  showLocation: boolean;
}

export function FileTile({
  file,
  isSelected,
  onSelect,
  showLocation,
}: FileTileProps) {
  const versionLabel = getVersionLabel(file.name);

  return (
    <button
      type="button"
      className={`file-tile${isSelected ? " file-tile--selected" : ""}`}
      title={showLocation ? file.key : file.name}
      onClick={() => onSelect(file)}
    >
      <FileThumbnail file={file} />
      <span className="file-tile__name">{file.name}</span>
      <span className="file-tile__meta">
        {versionLabel ? `${versionLabel} · ` : ""}
        {formatFileSize(file.sizeBytes)}
        {showLocation ? ` · ${getFolderPath(file.key) || "Top level"}` : ""}
      </span>
    </button>
  );
}
