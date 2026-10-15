function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const storageConfig = {
  // The Drive folder (or shared drive) that holds everything. Its ID is the last part of its URL.
  rootFolderId: requireEnv("GOOGLE_DRIVE_ROOT_FOLDER_ID"),
  routesBasePath: "/api/storage", // where storageRoutes is mounted
  // Signs download links. When empty, a new one is made each time the server starts.
  downloadLinkSecret: process.env.DOWNLOAD_LINK_SECRET ?? "",
  hiddenFileNames: [".bzEmpty", ".DS_Store"],
  hiddenFilePrefixes: ["._"], // macOS metadata copies of real files
  fileIndexCachePath: ".cache/file-index.json", // relative to server/
  downloadUrlExpiresInSeconds: 300,
  fileIndexRefreshMinutes: 10,
  searchResultLimit: 200,
  thumbnailCacheFolder: ".cache/thumbnails", // relative to server/
  thumbnailSizePx: 320,
  thumbnailMaxSourceBytes: 150 * 1024 * 1024, // skip originals bigger than 150 MB
  thumbnailExtensions: ["png", "jpg", "jpeg", "webp", "gif"],
  maxUploadBytes: 5 * 1024 ** 3, // 5 GB, kept from the S3 setup (Drive itself allows more)
  driveChangesPollSeconds: 15, // how often to ask Drive what changed
  indexRefreshAfterChangeSeconds: 5, // wait for a burst of changes to end before re-crawling
  eventsKeepAliveSeconds: 25, // keeps live-update connections open through proxies
};
