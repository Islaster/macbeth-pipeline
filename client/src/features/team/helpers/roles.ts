import type { UserRole } from "../../../../../shared/types/user";

export const roleLabels: Record<UserRole, string> = {
  creative_lead: "Creative Lead",
  lead: "Lead",
  artist: "Artist",
};

// Mirrors the server's rule so the form only offers allowed roles.
// The server still enforces it on every invite.
const rolesEachRoleCanCreate: Record<UserRole, UserRole[]> = {
  creative_lead: ["creative_lead", "lead", "artist"],
  lead: ["artist"],
  artist: [],
};

export function getCreatableRoles(role: UserRole): UserRole[] {
  return rolesEachRoleCanCreate[role];
}
