import type { UserRole } from "../../../../../shared/types/user";

const rolesEachRoleCanCreate: Record<UserRole, UserRole[]> = {
  creative_lead: ["creative_lead", "lead", "artist"],
  lead: ["artist"],
  artist: [],
};

export function canCreateRole(
  creatorRole: UserRole,
  newRole: UserRole
): boolean {
  return rolesEachRoleCanCreate[creatorRole].includes(newRole);
}

export function isUserRole(value: unknown): value is UserRole {
  return value === "creative_lead" || value === "lead" || value === "artist";
}
