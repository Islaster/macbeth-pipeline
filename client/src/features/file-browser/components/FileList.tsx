import type { StoredFile } from "../../../../../shared/types/storedFile";
import { useViewMode } from "../hooks/useViewMode";
import { FileRow } from "./FileRow";
import { FileTile } from "./FileTile";

interface FileListProps {
  files: StoredFile[];
  selectedKey: string | null;
  onSelectFile: (file: StoredFile) => void;
  showLocation: boolean;
  showHeader?: boolean; // off inside folder dropdowns
}

export function FileList({
  files,
  selectedKey,
  onSelectFile,
  showLocation,
  showHeader = true,
}: FileListProps) {
  const viewMode = useViewMode();
  if (files.length === 0) return null;

  if (viewMode === "thumbnail") {
    return (
      <section className="file-tiles">
        {files.map((file) => (
          <FileTile
            key={file.key}
            file={file}
            isSelected={file.key === selectedKey}
            onSelect={onSelectFile}
            showLocation={showLocation}
          />
        ))}
      </section>
    );
  }

  return (
    <section
      className={`file-list file-list--${viewMode}${
        showHeader ? "" : " file-list--nested"
      }`}
    >
      {showHeader && (
        <div className="file-list__header">
          <span>Type</span>
          <span>Name</span>
          <span>Version</span>
          <span>Size</span>
          <span>Modified</span>
        </div>
      )}
      {files.map((file) => (
        <FileRow
          key={file.key}
          file={file}
          isSelected={file.key === selectedKey}
          onSelect={onSelectFile}
          showLocation={showLocation}
        />
      ))}
    </section>
  );
}
