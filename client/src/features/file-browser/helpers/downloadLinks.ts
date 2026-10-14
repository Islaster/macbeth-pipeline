import { fetchDownloadUrl } from "../api/storageApi";

// Links last 5 minutes on the server; a fresh one is fetched a little before that.
const linkLifetimeMs = 4 * 60 * 1000;
const readyLinks = new Map<string, { url: string; fetchedAt: number }>();
const pendingLinks = new Map<string, Promise<void>>();

// The ready link for a file, or null when none has been fetched yet or it has aged out.
export function readDownloadLink(key: string): string | null {
  const link = readyLinks.get(key);
  if (!link) return null;
  if (Date.now() - link.fetchedAt > linkLifetimeMs) {
    readyLinks.delete(key);
    return null;
  }
  return link.url;
}

// Asks the server for a link ahead of time, so it's ready the moment a drag starts.
export function prepareDownloadLink(key: string): void {
  if (readDownloadLink(key) || pendingLinks.has(key)) return;
  const request = fetchDownloadUrl(key, { save: true })
    .then((url) => {
      readyLinks.set(key, { url, fetchedAt: Date.now() });
    })
    .catch(() => {
      // Nothing to do: without a link the drag just won't download anything.
    })
    .finally(() => pendingLinks.delete(key));
  pendingLinks.set(key, request);
}

// Saves the file to the browser's downloads folder. The page stays where it is.
export async function downloadFile(key: string): Promise<void> {
  const url =
    readDownloadLink(key) ?? (await fetchDownloadUrl(key, { save: true }));
  window.location.assign(url);
}
