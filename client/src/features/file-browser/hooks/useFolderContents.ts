import { useEffect, useState } from "react";
import type {
  StoredFile,
  StoredFolder,
} from "../../../../../shared/types/storedFile";
import { fetchFolderContents } from "../api/storageApi";
import { affectsFolder, subscribeToStorageEvents } from "../api/storageEvents";

export function useFolderContents(folder: string) {
  const [folders, setFolders] = useState<StoredFolder[]>([]);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumped to fetch the folder again. Quiet reloads keep the current list on screen.
  const [reload, setReload] = useState({ count: 0, isQuiet: false });

  useEffect(() => {
    let isCurrent = true; // ignore results from a folder we've already left
    if (!reload.isQuiet) setIsLoading(true);
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
  }, [folder, reload]);

  // Someone else changed this folder: fetch it again without a loading flash.
  useEffect(
    () =>
      subscribeToStorageEvents((event) => {
        if (affectsFolder(event, folder))
          setReload((current) => ({ count: current.count + 1, isQuiet: true }));
      }),
    [folder]
  );

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

  return {
    folders,
    files,
    nextCursor,
    isLoading,
    error,
    loadMore,
    reload: () =>
      setReload((current) => ({ count: current.count + 1, isQuiet: false })),
  };
}
