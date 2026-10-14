export interface StoredFile {
  key: string; // full S3 path, e.g. "scenes/intro/cut_v2.mp4"
  name: string; // last segment of the key
  sizeBytes: number;
  lastModified: string;
}

export interface StoredFolder {
  path: string; // "Assets/Characters/" — pass back as `folder` to open it
  name: string; // "Characters"
}

export interface StoredFilePage {
  folders: StoredFolder[];
  files: StoredFile[];
  nextCursor: string | null;
}

export interface StoredFileVersion {
  versionId: string;
  sizeBytes: number;
  lastModified: string;
  isLatest: boolean;
}

export interface StorageSearchResults {
  files: StoredFile[]; // filled when searching for files
  folders: StoredFolder[]; // filled when searching for folders
  totalMatches: number;
  isIndexReady: boolean;
}
export type SearchTarget = "files" | "folders";
export type AssetType = "characterSheets" | "props";
