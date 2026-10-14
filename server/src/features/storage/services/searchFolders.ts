import type { StorageSearchResults } from "../../../../../shared/types/storedFile";
import { getFileIndex } from "./fileIndex";
import { containsAllWords, toSearchWords } from "../helpers/searchWords";
import { storageConfig } from "../config/storageConfig";

export function searchFolders(
  query: string,
  withinFolder?: string
): StorageSearchResults {
  const { folders, isReady } = getFileIndex();
  const words = toSearchWords(query);
  const hasNoFilters = words.length === 0 && !withinFolder;
  const matches = hasNoFilters
    ? []
    : folders.filter(
        (folder) =>
          (!withinFolder || folder.path.startsWith(withinFolder)) &&
          containsAllWords(folder.name, words)
      );

  return {
    files: [],
    folders: matches.slice(0, storageConfig.searchResultLimit),
    totalMatches: matches.length,
    isIndexReady: isReady,
  };
}
