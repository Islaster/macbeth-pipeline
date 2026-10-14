interface NavbarToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function NavbarToggle({ isCollapsed, onToggle }: NavbarToggleProps) {
  return (
    <button
      type="button"
      className="navbar__toggle"
      aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
      aria-expanded={!isCollapsed}
      onClick={onToggle}
    >
      {isCollapsed ? "»" : "«"}
    </button>
  );
}
