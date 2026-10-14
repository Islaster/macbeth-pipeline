import type { StoredFile } from "../../../../../shared/types/storedFile";
import {
  getFileExtension,
  getFileKind,
  getFolderPath,
  getVersionLabel,
} from "../helpers/fileNameDetails";
import { formatFileSize } from "../helpers/formatFileSize";
import { useViewMode } from "../hooks/useViewMode";

interface FileRowProps {
  file: StoredFile;
  isSelected: boolean;
  onSelect: (file: StoredFile) => void;
  showLocation: boolean;
}

export function FileRow({
  file,
  isSelected,
  onSelect,
  showLocation,
}: FileRowProps) {
  const isDetailed = useViewMode() === "detailed";
  return (
    <button
      type="button"
      className={`file-row${isSelected ? " file-row--selected" : ""}`}
      onClick={() => onSelect(file)}
    >
      <span
        className={`file-row__kind file-row__kind--${getFileKind(file.name)}`}
      >
        {getFileExtension(file.name) || "file"}
      </span>
      <span className="file-row__name">
        <span className="file-row__title" title={file.name}>
          {file.name}
        </span>
        {(showLocation || isDetailed) && (
          <span className="file-row__location" title={file.key}>
            {getFolderPath(file.key) || "Top level"}
          </span>
        )}
      </span>
      <span className="file-row__version">
        {getVersionLabel(file.name) ?? "—"}
      </span>
      <span className="file-row__meta">{formatFileSize(file.sizeBytes)}</span>
      <span className="file-row__meta">
        {isDetailed
          ? new Date(file.lastModified).toLocaleString()
          : new Date(file.lastModified).toLocaleDateString()}
      </span>
    </button>
  );
}
