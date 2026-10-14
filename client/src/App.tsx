import { useState } from "react";
import { FileBrowser } from "./features/file-browser/FileBrowser";
import { Navbar } from "./features/navigation/Navbar";
import type { NavItemId } from "./features/navigation/config/navItems";
import { AuthGate } from "./features/auth/AuthGate";
import { TeamPage } from "./features/team/TeamPage";

function SignedInApp() {
  const [activeSection, setActiveSection] = useState<NavItemId>("storage");

  return (
    <div className="app-layout">
      <Navbar activeItemId={activeSection} onSelectItem={setActiveSection} />
      {activeSection === "storage" && <FileBrowser />}
      {activeSection === "team" && <TeamPage />}
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <SignedInApp />;
    </AuthGate>
  );
}
