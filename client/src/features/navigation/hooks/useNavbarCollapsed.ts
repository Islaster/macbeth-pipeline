import { useEffect, useState } from "react";

const storageKey = "navbar-collapsed";

function readSavedChoice(): boolean {
  try {
    return localStorage.getItem(storageKey) === "true";
  } catch {
    return false; // storage unavailable, so start expanded
  }
}

// Remembers whether the navbar is collapsed, even after a reload.
export function useNavbarCollapsed() {
  const [isCollapsed, setIsCollapsed] = useState(readSavedChoice);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(isCollapsed));
    } catch {
      // The navbar still works without being remembered.
    }
  }, [isCollapsed]);

  return {
    isCollapsed,
    toggleCollapsed: () => setIsCollapsed((current) => !current),
  };
}
