export type UserRole = "creative_lead" | "lead" | "artist";
// What the invite screen shows about a pending invite.
export type InviteDetails = NewInvite;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface NewInvite {
  email: string;
  name: string;
  role: UserRole;
}

export interface CreatedInvite {
  inviteLink: string; // the creator sends this to the new person
  expiresAt: string;
}
