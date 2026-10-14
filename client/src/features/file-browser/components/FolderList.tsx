import type {
  StoredFile,
  StoredFolder,
} from "../../../../../shared/types/storedFile";
import type { FileKindFilter } from "../helpers/fileFilters";
import { FolderDropdown } from "./FolderDropdown";

interface FolderListProps {
  folders: StoredFolder[];
  showLocation: boolean;
  kind: FileKindFilter;
  selectedKey: string | null;
  onSelectFile: (file: StoredFile) => void;
}

export function FolderList({
  folders,
  showLocation,
  kind,
  selectedKey,
  onSelectFile,
}: FolderListProps) {
  if (folders.length === 0) return null;

  return (
    <section className="folder-list">
      {folders.map((folder) => (
        <FolderDropdown
          key={folder.path}
          folder={folder}
          showLocation={showLocation}
          kind={kind}
          selectedKey={selectedKey}
          onSelectFile={onSelectFile}
        />
      ))}
    </section>
  );
}
