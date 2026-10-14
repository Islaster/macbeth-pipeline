import type { User } from "../../../../../shared/types/user";
import { database } from "../../../database/database";
import { authConfig } from "../config/authConfig";
import { AuthError } from "../helpers/AuthError";
import { hashPassword } from "../helpers/passwordHashing";
import { findPendingInvite } from "./findPendingInvite";

const uniqueViolationCode = "23505"; // Postgres: that email is already taken

export async function acceptInvite(
  token: string,
  password: string
): Promise<User> {
  if (password.length < authConfig.minPasswordLength) {
    throw new AuthError(
      400,
      `Password must be at least ${authConfig.minPasswordLength} characters.`
    );
  }

  const invite = await findPendingInvite(token);
  if (!invite)
    throw new AuthError(400, "This invite link is invalid or has expired.");

  const passwordHash = await hashPassword(password);
  const connection = await database.connect();

  try {
    await connection.query("BEGIN");

    // Marking the invite used first means one link can never create two accounts.
    const claimed = await connection.query(
      "UPDATE invites SET accepted_at = now() WHERE id = $1 AND accepted_at IS NULL",
      [invite.id]
    );
    if (claimed.rowCount !== 1)
      throw new AuthError(400, "This invite link has already been used.");

    const created = await connection.query<User>(
      `INSERT INTO users (email, name, role, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role`,
      [invite.email, invite.name, invite.role, passwordHash]
    );
    const user = created.rows[0];
    if (!user) throw new Error("The account was not created");

    await connection.query("COMMIT");
    return user;
  } catch (error) {
    await connection.query("ROLLBACK");
    if ((error as { code?: string }).code === uniqueViolationCode) {
      throw new AuthError(409, "An account with that email already exists.");
    }
    throw error;
  } finally {
    connection.release();
  }
}
