import { useEffect, useRef, useState, type DragEvent } from "react";
import type {
  StoredFile,
  StoredFolder,
} from "../../../../../shared/types/storedFile";
import type { FileKindFilter } from "../helpers/fileFilters";
import { useUploadFiles } from "../hooks/useUploads";
import { AddFilesButton } from "./AddFilesButton";
import { FolderDropdownContents } from "./FolderDropdownContents";
import { NewFolderButton } from "./NewFolderButton";

interface FolderDropdownProps {
  folder: StoredFolder;
  showLocation: boolean;
  kind: FileKindFilter;
  selectedKey: string | null;
  onSelectFile: (file: StoredFile) => void;
}

const openOnHoverDelayMs = 600; // how long files must hover before the folder opens

function isDraggingFiles(event: DragEvent): boolean {
  return event.dataTransfer.types.includes("Files");
}

export function FolderDropdown({
  folder,
  showLocation,
  kind,
  selectedKey,
  onSelectFile,
}: FolderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadFiles = useUploadFiles();

  function cancelOpenOnHover() {
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = null;
  }

  // Don't leave a timer running if this folder disappears mid-drag.
  useEffect(() => cancelOpenOnHover, []);

  async function addFiles(files: File[]) {
    if (files.length === 0) return;
    setIsOpen(true);
    await uploadFiles(folder.path, files);
    setReloadCount((count) => count + 1); // reload the contents so the new files appear
  }

  function showNewFolder() {
    setIsOpen(true);
    setReloadCount((count) => count + 1);
  }

  return (
    <div className="folder-dropdown">
      <div
        className={`folder-dropdown__row${
          isDropTarget ? " folder-dropdown__row--drop-target" : ""
        }`}
        onDragOver={(event) => {
          if (!isDraggingFiles(event)) return;
          event.preventDefault(); // marks this row as somewhere files can be dropped
          setIsDropTarget(true);

          // Start the countdown once; it opens the folder if the files stay here.
          if (!isOpen && !openTimer.current) {
            openTimer.current = setTimeout(() => {
              setIsOpen(true);
              openTimer.current = null;
            }, openOnHoverDelayMs);
          }
        }}
        onDragLeave={(event) => {
          // Ignore moves between the row's own children.
          if (event.currentTarget.contains(event.relatedTarget as Node | null))
            return;
          setIsDropTarget(false);
          cancelOpenOnHover();
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDropTarget(false);
          cancelOpenOnHover();
          void addFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <button
          type="button"
          className="folder-dropdown__toggle"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span
            className={`folder-dropdown__arrow${
              isOpen ? " folder-dropdown__arrow--open" : ""
            }`}
          >
            ▸
          </span>
          <span className="folder-dropdown__name" title={folder.path}>
            📁 {showLocation ? folder.path : folder.name}
          </span>
        </button>
        <AddFilesButton
          label={`Add files to ${folder.name}`}
          onFilesChosen={(files) => void addFiles(files)}
        />
        <NewFolderButton
          parentPath={folder.path}
          parentName={folder.name}
          onCreated={showNewFolder}
        />
      </div>

      {/* Contents load only once the folder is opened. */}
      {isOpen && (
        <div className="folder-dropdown__contents">
          <FolderDropdownContents
            key={reloadCount}
            folderPath={folder.path}
            kind={kind}
            selectedKey={selectedKey}
            onSelectFile={onSelectFile}
          />
        </div>
      )}
    </div>
  );
}
