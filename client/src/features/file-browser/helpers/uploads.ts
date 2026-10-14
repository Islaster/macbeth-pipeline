import { createContext } from "react";

export interface UploadItem {
  id: string;
  fileName: string;
  folder: string;
  percent: number; // 0 to 100
  status: "uploading" | "done" | "failed";
  error?: string; // why it failed, in one sentence
  errorDetails?: string[]; // the specific things to fix, when the server listed them
}

// Lets any folder in the tree start uploads without the function being passed down by hand.
export type UploadFiles = (folder: string, files: File[]) => Promise<void>;
export const UploadsContext = createContext<UploadFiles | null>(null);
