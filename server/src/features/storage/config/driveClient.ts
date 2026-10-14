import { auth, drive } from "@googleapis/drive";

const driveScope = "https://www.googleapis.com/auth/drive";

// Two ways to sign in:
// - A personal Google account: set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
//   and GOOGLE_OAUTH_REFRESH_TOKEN. Files are owned by, and count against, that account.
// - A service account: set GOOGLE_APPLICATION_CREDENTIALS to its key file. It has no
//   storage of its own, so uploads only work when the root folder is in a shared drive.
function createDriveAuth() {
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!refreshToken) return new auth.GoogleAuth({ scopes: [driveScope] });

  const oauthClient = new auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  );
  oauthClient.setCredentials({ refresh_token: refreshToken });
  return oauthClient;
}

export const driveAuth = createDriveAuth();
export const driveClient = drive({ version: "v3", auth: driveAuth });

export const folderMimeType = "application/vnd.google-apps.folder";

// Needed on every call so files inside shared drives are found too.
export const sharedDriveOptions = {
  supportsAllDrives: true,
  includeItemsFromAllDrives: true,
};
