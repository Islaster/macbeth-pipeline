// Invite links look like /accept-invite#token=abc123
export function readInviteToken(): string | null {
  if (window.location.pathname !== "/accept-invite") return null;
  return new URLSearchParams(window.location.hash.slice(1)).get("token");
}
