import type { NavItem, NavItemId } from "../config/navItems";

interface NavbarItemProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onSelect: (id: NavItemId) => void;
}

export function NavbarItem({
  item,
  isActive,
  isCollapsed,
  onSelect,
}: NavbarItemProps) {
  return (
    <button
      type="button"
      className={`navbar__item${isActive ? " navbar__item--active" : ""}`}
      aria-current={isActive ? "page" : undefined}
      title={isCollapsed ? item.label : undefined}
      onClick={() => onSelect(item.id)}
    >
      <span className="navbar__icon" aria-hidden="true">
        {item.icon}
      </span>
      {!isCollapsed && <span className="navbar__label">{item.label}</span>}
    </button>
  );
}
