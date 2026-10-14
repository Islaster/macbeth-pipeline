import type {
  StoredFilePage,
  SearchTarget,
  StorageSearchResults,
  AssetType,
  StoredFile,
} from "../../../../../shared/types/storedFile";

interface SearchScope {
  withinFolder: string | null;
  assetType: AssetType | null;
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return (await response.json()) as T;
}

export function fetchFolderContents(
  folder: string,
  cursor?: string
): Promise<StoredFilePage> {
  const params = new URLSearchParams();
  if (folder) params.set("folder", folder);
  if (cursor) params.set("cursor", cursor);
  return getJson<StoredFilePage>(`/api/storage/files?${params}`);
}

export async function fetchDownloadUrl(key: string): Promise<string> {
  const params = new URLSearchParams({ key });
  const { url } = await getJson<{ url: string }>(
    `/api/storage/download-url?${params}`
  );
  return url;
}

export function searchStorage(
  query: string,
  target: SearchTarget,
  scope: SearchScope
): Promise<StorageSearchResults> {
  const params = new URLSearchParams({ q: query, target });
  if (scope.withinFolder) params.set("within", scope.withinFolder);
  if (scope.assetType) params.set("assetType", scope.assetType);
  return getJson<StorageSearchResults>(`/api/storage/search?${params}`);
}

// The file's modified date is part of the address, so a changed file gets a new thumbnail.
export function getThumbnailUrl(file: StoredFile): string {
  return `/api/storage/thumbnail?${new URLSearchParams({
    key: file.key,
    v: file.lastModified,
  })}`;
}
