import type {
  CreatedInvite,
  NewInvite,
  User,
} from "../../../../../shared/types/user";
import { database } from "../../../database/database";
import { authConfig } from "../config/authConfig";
import { AuthError } from "../helpers/AuthError";
import { canCreateRole } from "../helpers/rolePermissions";
import { createSecretToken } from "../helpers/secretToken";

const hourInMs = 60 * 60 * 1000; // replaces dayInMs

// Saves the invite and returns the one-time link. No permission checks here.
export async function issueInvite(
  newInvite: NewInvite,
  invitedById: string | null
): Promise<CreatedInvite> {
  const { token, tokenHash } = createSecretToken();
  const expiresAt = new Date(Date.now() + authConfig.inviteHours * hourInMs);

  await database.query(
    `INSERT INTO invites (email, name, role, token_hash, invited_by, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      newInvite.email.trim().toLowerCase(),
      newInvite.name.trim(),
      newInvite.role,
      tokenHash,
      invitedById,
      expiresAt,
    ]
  );

  // The token sits after "#", which browsers never send to servers or put in server logs.
  return {
    inviteLink: `${authConfig.appUrl}/accept-invite#token=${token}`,
    expiresAt: expiresAt.toISOString(),
  };
}

// What management and leads use: checks they're allowed to create this role first.
export async function createInvite(
  invitedBy: User,
  newInvite: NewInvite
): Promise<CreatedInvite> {
  if (!canCreateRole(invitedBy.role, newInvite.role)) {
    throw new AuthError(403, "You can't create accounts with that role.");
  }

  const existing = await database.query(
    "SELECT 1 FROM users WHERE email = $1",
    [newInvite.email.trim().toLowerCase()]
  );
  if (existing.rowCount)
    throw new AuthError(409, "An account with that email already exists.");

  return issueInvite(newInvite, invitedBy.id);
}
