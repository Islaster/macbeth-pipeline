import type { User } from "../../../../../shared/types/user";
import { database } from "../../../database/database";
import { AuthError } from "../helpers/AuthError";
import { isCorrectPassword } from "../helpers/passwordHashing";

export async function signIn(email: string, password: string): Promise<User> {
  const result = await database.query<User & { password_hash: string }>(
    "SELECT id, email, name, role, password_hash FROM users WHERE email = $1 AND is_active",
    [email.trim().toLowerCase()]
  );
  const account = result.rows[0];

  // The same message either way, so nobody can test which emails have accounts.
  if (!account || !(await isCorrectPassword(account.password_hash, password))) {
    throw new AuthError(401, "Email or password is incorrect.");
  }

  return {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role,
  };
}
