import type { StoredFile } from "../../../../../shared/types/storedFile";
import { filterFilesByKind, type FileKindFilter } from "../helpers/fileFilters";
import { useFolderContents } from "../hooks/useFolderContents";
import { FileList } from "./FileList";
import { FolderList } from "./FolderList";

interface FolderDropdownContentsProps {
  folderPath: string;
  kind: FileKindFilter;
  selectedKey: string | null;
  onSelectFile: (file: StoredFile) => void;
}

export function FolderDropdownContents({
  folderPath,
  kind,
  selectedKey,
  onSelectFile,
}: FolderDropdownContentsProps) {
  const { folders, files, nextCursor, isLoading, error, loadMore } =
    useFolderContents(folderPath);
  const visibleFiles = filterFilesByKind(files, kind);

  if (isLoading) return <p className="file-browser__message">Loading…</p>;
  if (error)
    return (
      <p className="file-browser__message file-browser__message--error">
        {error}
      </p>
    );
  if (folders.length === 0 && visibleFiles.length === 0) {
    return (
      <p className="file-browser__message">Nothing to show in this folder.</p>
    );
  }

  return (
    <>
      {/* Subfolders are dropdowns too, so the tree can open as deep as it goes. */}
      <FolderList
        folders={folders}
        showLocation={false}
        kind={kind}
        selectedKey={selectedKey}
        onSelectFile={onSelectFile}
      />

      <FileList
        files={visibleFiles}
        selectedKey={selectedKey}
        onSelectFile={onSelectFile}
        showLocation={false}
        showHeader={false}
      />

      {nextCursor && (
        <button
          type="button"
          className="file-browser__load-more"
          onClick={() => void loadMore()}
        >
          Load more
        </button>
      )}
    </>
  );
}
