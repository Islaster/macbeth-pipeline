import { useEffect, useState } from "react";
import type {
  StoredFile,
  StoredFolder,
} from "../../../../../shared/types/storedFile";
import { fetchFolderContents } from "../api/storageApi";

export function useFolderContents(folder: string) {
  const [folders, setFolders] = useState<StoredFolder[]>([]);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0); // bumped to fetch the folder again

  useEffect(() => {
    let isCurrent = true; // ignore results from a folder we've already left
    setIsLoading(true);
    setError(null);

    fetchFolderContents(folder)
      .then((page) => {
        if (!isCurrent) return;
        setFolders(page.folders);
        setFiles(page.files);
        setNextCursor(page.nextCursor);
      })
      .catch((cause: unknown) => {
        if (isCurrent)
          setError(
            cause instanceof Error ? cause.message : "Could not load files"
          );
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [folder, reloadCount]);

  async function loadMore() {
    if (!nextCursor) return;
    try {
      const page = await fetchFolderContents(folder, nextCursor);
      setFolders((current) => [...current, ...page.folders]);
      setFiles((current) => [...current, ...page.files]);
      setNextCursor(page.nextCursor);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load more files"
      );
    }
  }

  function reload() {
    setReloadCount((count) => count + 1);
  }

  return { folders, files, nextCursor, isLoading, error, loadMore, reload };
}
