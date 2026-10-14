import type {
  AssetType,
  StorageSearchResults,
  StoredFile,
} from "../../../../../shared/types/storedFile";
import { storageConfig } from "../config/storageConfig";
import { matchesAssetType } from "../helpers/matchesAssetType";
import { containsAllWords, toSearchWords } from "../helpers/searchWords";
import { getFileIndex } from "./fileIndex";

export interface FileSearchFilters {
  withinFolder?: string;
  assetType?: AssetType;
}

// A pasted full path ("Assets/Characters/sheet.png") finds exactly that file.
function findFileByExactPath(
  files: StoredFile[],
  query: string
): StoredFile | undefined {
  const path = query.trim().replace(/^\/+/, ""); // allow a leading slash
  if (!path.includes("/")) return undefined; // not a path, so use the normal name search
  return files.find((file) => file.key === path);
}

export function searchFiles(
  query: string,
  filters: FileSearchFilters = {}
): StorageSearchResults {
  const { files, isReady } = getFileIndex();
  const { withinFolder, assetType } = filters;

  const exactFile = findFileByExactPath(files, query);
  if (exactFile) {
    return {
      files: [exactFile],
      folders: [],
      totalMatches: 1,
      isIndexReady: isReady,
    };
  }

  const words = toSearchWords(query);
  const hasNoFilters = words.length === 0 && !withinFolder && !assetType;
  const matches = hasNoFilters
    ? []
    : files.filter(
        (file) =>
          (!withinFolder || file.key.startsWith(withinFolder)) &&
          (!assetType || matchesAssetType(file, assetType)) &&
          containsAllWords(file.name, words)
      );

  return {
    files: matches.slice(0, storageConfig.searchResultLimit),
    folders: [],
    totalMatches: matches.length,
    isIndexReady: isReady,
  };
}
