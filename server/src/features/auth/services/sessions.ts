import type { User } from "../../../../../shared/types/user";
import { database } from "../../../database/database";
import { authConfig } from "../config/authConfig";
import { createSecretToken, hashSecretToken } from "../helpers/secretToken";

const dayInMs = 24 * 60 * 60 * 1000;

export async function startSession(
  userId: string
): Promise<{ token: string; expiresAt: Date }> {
  const { token, tokenHash } = createSecretToken();
  const expiresAt = new Date(Date.now() + authConfig.sessionDays * dayInMs);
  await database.query(
    "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, tokenHash, expiresAt]
  );
  return { token, expiresAt };
}

export async function findSessionUser(token: string): Promise<User | null> {
  const result = await database.query<User>(
    `SELECT users.id, users.email, users.name, users.role
       FROM sessions
       JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = $1
        AND sessions.expires_at > now()
        AND users.is_active`,
    [hashSecretToken(token)]
  );
  return result.rows[0] ?? null;
}

export async function endSession(token: string): Promise<void> {
  await database.query("DELETE FROM sessions WHERE token_hash = $1", [
    hashSecretToken(token),
  ]);
}
