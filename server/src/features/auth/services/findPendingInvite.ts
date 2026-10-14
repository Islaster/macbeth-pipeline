import type { UserRole } from "../../../../../shared/types/user";
import { database } from "../../../database/database";
import { hashSecretToken } from "../helpers/secretToken";

export interface PendingInvite {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Returns the invite only if it exists, hasn't been used, and hasn't expired.
export async function findPendingInvite(
  token: string
): Promise<PendingInvite | null> {
  const result = await database.query<PendingInvite>(
    `SELECT id, email, name, role
       FROM invites
      WHERE token_hash = $1 AND accepted_at IS NULL AND expires_at > now()`,
    [hashSecretToken(token)]
  );
  return result.rows[0] ?? null;
}
