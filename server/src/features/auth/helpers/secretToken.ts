import { createHash, randomBytes } from "node:crypto";

// The raw token goes to the person (in a link or cookie). Only its hash is stored,
// so a leaked database can't be used to sign in or accept invites.
export function createSecretToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashSecretToken(token) };
}

export function hashSecretToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
