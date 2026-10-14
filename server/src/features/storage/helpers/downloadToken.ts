import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { storageConfig } from "../config/storageConfig";

export interface DownloadLink {
  fileId: string;
  revisionId?: string;
  name: string;
  asAttachment?: boolean;
}

const secret =
  storageConfig.downloadLinkSecret || randomBytes(32).toString("hex");

function sign(payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

// Packs the link details and an expiry time into a token nobody can alter.
export function createDownloadToken(link: DownloadLink): string {
  const expiresAt =
    Date.now() + storageConfig.downloadUrlExpiresInSeconds * 1000;
  const payload = Buffer.from(JSON.stringify({ ...link, expiresAt })).toString(
    "base64url"
  );
  return `${payload}.${sign(payload)}`;
}

// Returns null when the token is missing, altered, or expired.
export function readDownloadToken(token?: string): DownloadLink | null {
  const [payload, signature] = (token ?? "").split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected))
    return null;

  const { expiresAt, ...link } = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8")
  ) as DownloadLink & { expiresAt: number };
  return Date.now() < expiresAt ? link : null;
}
