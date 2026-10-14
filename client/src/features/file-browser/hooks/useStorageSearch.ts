import { useEffect, useState } from "react";
import type { StorageSearchResults } from "../../../../../shared/types/storedFile";
import { searchStorage } from "../api/storageApi";
import type { FileFilters } from "../helpers/fileFilters";

const searchDelayMs = 250; // wait for a pause in typing before asking the server
const indexRetryDelayMs = 3000; // how often to ask again while the server reads storage
const noResults: StorageSearchResults = {
  files: [],
  folders: [],
  totalMatches: 0,
  isIndexReady: true,
};

export function useStorageSearch(filters: FileFilters) {
  const [results, setResults] = useState<StorageSearchResults>(noResults);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = filters.searchText.trim();
  const target = filters.searchTarget;
  const withinFolder = filters.sequencePath;
  // Asset types describe files, so they don't apply when searching folder names.
  const assetType = target === "files" ? filters.assetType : null;
  const isActive =
    query.length > 0 || withinFolder !== null || assetType !== null;

  useEffect(() => {
    if (!isActive) {
      setResults(noResults);
      setIsSearching(false);
      setError(null);
      return;
    }

    let isCurrent = true;
    let timer: ReturnType<typeof setTimeout>;
    setIsSearching(true);

    const runSearch = () => {
      searchStorage(query, target, { withinFolder, assetType })
        .then((found) => {
          if (!isCurrent) return;
          setResults(found);
          setError(null);
          // The server is still reading storage, so ask again shortly.
          if (!found.isIndexReady)
            timer = setTimeout(runSearch, indexRetryDelayMs);
        })
        .catch((cause: unknown) => {
          if (isCurrent)
            setError(cause instanceof Error ? cause.message : "Search failed");
        })
        .finally(() => {
          if (isCurrent) setIsSearching(false);
        });
    };

    timer = setTimeout(runSearch, searchDelayMs);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [isActive, query, target, withinFolder, assetType]);

  return { results, isSearching, error, isActive };
}
