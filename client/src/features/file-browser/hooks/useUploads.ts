import { useContext, useEffect, useState } from "react";
import {
  requestUploadUrl,
  sendFileToStorage,
  UploadRefused,
} from "../api/uploadApi";
import {
  UploadsContext,
  type UploadFiles,
  type UploadItem,
} from "../helpers/uploads";

// Owns the list of uploads. Used once, in FileBrowser.
export function useUploads() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  // The file name that was refused for its naming, while the help is open.
  const [namingHelpFor, setNamingHelpFor] = useState<string | null>(null);

  function updateUpload(id: string, changes: Partial<UploadItem>) {
    setUploads((current) =>
      current.map((upload) =>
        upload.id === id ? { ...upload, ...changes } : upload
      )
    );
  }

  async function uploadOne(folder: string, file: File): Promise<void> {
    const id = crypto.randomUUID();
    setUploads((current) => [
      ...current,
      { id, fileName: file.name, folder, percent: 0, status: "uploading" },
    ]);

    try {
      const uploadUrl = await requestUploadUrl(folder, file);
      let lastPercent = 0;
      await sendFileToStorage(uploadUrl, file, (percent) => {
        if (percent === lastPercent) return; // only redraw when the number changes
        lastPercent = percent;
        updateUpload(id, { percent });
      });
      updateUpload(id, { percent: 100, status: "done" });
    } catch (cause) {
      if (cause instanceof UploadRefused && cause.code === "naming") {
        setNamingHelpFor(file.name);
      }
      updateUpload(id, {
        status: "failed",
        error: cause instanceof Error ? cause.message : "Upload failed",
      });
    }
  }

  // One file at a time, so large files don't compete with each other for bandwidth.
  const uploadFiles: UploadFiles = async (folder, files) => {
    for (const file of files) await uploadOne(folder, file);
  };

  function clearFinished() {
    setUploads((current) =>
      current.filter((upload) => upload.status === "uploading")
    );
  }

  return {
    uploads,
    uploadFiles,
    clearFinished,
    namingHelpFor,
    closeNamingHelp: () => setNamingHelpFor(null),
  };
}

// Starts uploads from anywhere inside the file browser.
export function useUploadFiles(): UploadFiles {
  const uploadFiles = useContext(UploadsContext);
  if (!uploadFiles)
    throw new Error("useUploadFiles must be used inside FileBrowser");
  return uploadFiles;
}

// Stops the browser from opening a file that's dropped outside a folder, which would leave the app.
export function usePreventStrayFileDrops(): void {
  useEffect(() => {
    const ignore = (event: DragEvent) => event.preventDefault();
    window.addEventListener("dragover", ignore);
    window.addEventListener("drop", ignore);
    return () => {
      window.removeEventListener("dragover", ignore);
      window.removeEventListener("drop", ignore);
    };
  }, []);
}
