import { useContext, useEffect, useState } from "react";
import {
  ViewModeContext,
  viewModeOptions,
  type ViewMode,
} from "../helpers/viewMode";

const storageKey = "file-view-mode";

function readSavedViewMode(): ViewMode {
  try {
    const saved = localStorage.getItem(storageKey);
    return viewModeOptions.some((option) => option.value === saved)
      ? (saved as ViewMode)
      : "list";
  } catch {
    return "list"; // storage unavailable
  }
}

// Holds the chosen view and remembers it between visits. Used once, in FileBrowser.
export function useSavedViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>(readSavedViewMode);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, viewMode);
    } catch {
      // The view still works without being remembered.
    }
  }, [viewMode]);

  return [viewMode, setViewMode] as const;
}

// Reads the current view from anywhere inside the file browser.
export function useViewMode(): ViewMode {
  return useContext(ViewModeContext);
}
