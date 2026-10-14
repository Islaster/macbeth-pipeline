import type { UserRole } from "../../../../../shared/types/user";

export type NavItemId = "storage" | "team";

export interface NavItem {
  id: NavItemId;
  label: string;
  icon: string;
  visibleTo?: UserRole[]; // leave out to show the item to everyone
}

// Add a section to the app by adding its id above and a line here.
export const navItems: NavItem[] = [
  { id: "storage", label: "Storage", icon: "☁️" },
  {
    id: "team",
    label: "Team",
    icon: "👥",
    visibleTo: ["creative_lead", "lead"],
  },
];
