import { useState } from "react";
import type { StoredFolder } from "../../../../../shared/types/storedFile";
import { createFolder } from "../api/storageApi";

interface NewFolderButtonProps {
  parentPath: string; // "" for the top level
  parentName: string; // shown in the prompt, e.g. "Characters" or "All files"
  onCreated: (folder: StoredFolder) => void;
}

export function NewFolderButton({
  parentPath,
  parentName,
  onCreated,
}: NewFolderButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    const name = window.prompt(`New folder inside ${parentName}:`)?.trim();
    if (!name) return;

    setIsCreating(true);
    setError(null);
    try {
      onCreated(await createFolder(parentPath, name));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create the folder"
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="new-folder-button"
        title={`New folder inside ${parentName}`}
        disabled={isCreating}
        onClick={() => void create()}
      >
        + Folder
      </button>
      {error && <span className="form-error">{error}</span>}
    </>
  );
}
