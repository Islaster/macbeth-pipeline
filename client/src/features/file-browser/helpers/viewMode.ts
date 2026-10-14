import { createContext } from "react";

export type ViewMode = "thumbnail" | "compact" | "list" | "detailed";

export const viewModeOptions: { value: ViewMode; label: string }[] = [
  { value: "thumbnail", label: "Thumbnail" },
  { value: "compact", label: "Compact" },
  { value: "list", label: "List" },
  { value: "detailed", label: "Detailed" },
];

// Lets any file component read the chosen view without it being passed down by hand.
export const ViewModeContext = createContext<ViewMode>("list");
