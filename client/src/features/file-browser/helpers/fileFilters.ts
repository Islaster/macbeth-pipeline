import type {
  StoredFile,
  SearchTarget,
  AssetType,
} from "../../../../../shared/types/storedFile";
import { getFileKind, type FileKind } from "./fileNameDetails";

export type FileKindFilter = FileKind | "all";

export interface FileFilters {
  searchText: string;
  kind: FileKindFilter;
  searchTarget: SearchTarget;
  sequencePath: string | null; // folder of the chosen sequence, or null for all
  assetType: AssetType | null; // null means all
}

export const emptyFileFilters: FileFilters = {
  searchText: "",
  searchTarget: "files",
  kind: "all",
  sequencePath: null,
  assetType: null,
};

export function filterFilesByKind(
  files: StoredFile[],
  kind: FileKindFilter
): StoredFile[] {
  if (kind === "all") return files;
  return files.filter((file) => getFileKind(file.name) === kind);
}
