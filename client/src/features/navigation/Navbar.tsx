import { signOut } from "../auth/api/authApi";
import { useAuth } from "../auth/hooks/useAuth";
import { NavbarItem } from "./components/NavbarItem";
import { NavbarToggle } from "./components/NavbarToggle";
import { navItems, type NavItemId } from "./config/navItems";
import { useNavbarCollapsed } from "./hooks/useNavbarCollapsed";
import { roleLabels } from "../team/helpers/roles";
import "./navbar.css";

interface NavbarProps {
  activeItemId: NavItemId;
  onSelectItem: (id: NavItemId) => void;
}

export function Navbar({ activeItemId, onSelectItem }: NavbarProps) {
  const { isCollapsed, toggleCollapsed } = useNavbarCollapsed();
  const { user, setUser } = useAuth();

  const visibleItems = navItems.filter(
    (item) =>
      !item.visibleTo || (user !== null && item.visibleTo.includes(user.role))
  );

  async function handleSignOut() {
    try {
      await signOut();
      setUser(null);
    } catch {
      // Still signed in on the server, so stay signed in here; the button can be pressed again.
    }
  }

  return (
    <nav
      className={`navbar${isCollapsed ? " navbar--collapsed" : ""}`}
      aria-label="Main"
    >
      <div className="navbar__header">
        {!isCollapsed && <span className="navbar__title">Pipeline</span>}
        <NavbarToggle isCollapsed={isCollapsed} onToggle={toggleCollapsed} />
      </div>

      <ul className="navbar__items">
        {visibleItems.map((item) => (
          <li key={item.id}>
            <NavbarItem
              item={item}
              isActive={item.id === activeItemId}
              isCollapsed={isCollapsed}
              onSelect={onSelectItem}
            />
          </li>
        ))}
      </ul>

      <div className="navbar__footer">
        {!isCollapsed && user && (
          <p className="navbar__user">
            {user.name}
            <span className="navbar__user-role">{roleLabels[user.role]}</span>
          </p>
        )}
        <button
          type="button"
          className="navbar__item"
          title={isCollapsed ? "Sign out" : undefined}
          onClick={() => void handleSignOut()}
        >
          <span className="navbar__icon" aria-hidden="true">
            ↩
          </span>
          {!isCollapsed && <span className="navbar__label">Sign out</span>}
        </button>
      </div>
    </nav>
  );
}
