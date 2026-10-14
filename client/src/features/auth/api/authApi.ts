import type {
  CreatedInvite,
  InviteDetails,
  NewInvite,
  User,
} from "../../../../../shared/types/user";

async function readError(response: Response): Promise<string> {
  if (response.status === 429)
    return "Too many attempts. Please wait a few minutes and try again.";
  const details = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return details?.error ?? `Request failed (${response.status})`;
}

async function post<T>(path: string, body: unknown = {}): Promise<T> {
  const response = await fetch(`/api/auth${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}

// Returns null when nobody is signed in.
export async function fetchCurrentUser(): Promise<User | null> {
  const response = await fetch("/api/auth/me");
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as User;
}

export function signIn(email: string, password: string): Promise<User> {
  return post<User>("/sign-in", { email, password });
}

export function signOut(): Promise<void> {
  return post<void>("/sign-out");
}

export function lookupInvite(token: string): Promise<InviteDetails> {
  return post<InviteDetails>("/invites/lookup", { token });
}

export function acceptInvite(token: string, password: string): Promise<User> {
  return post<User>("/invites/accept", { token, password });
}

export function createInvite(newInvite: NewInvite): Promise<CreatedInvite> {
  return post<CreatedInvite>("/invites", newInvite);
}
