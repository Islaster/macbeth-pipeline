import { useEffect, useState } from "react";
import type { StoredFile } from "../../../../../shared/types/storedFile";
import {
  getFileKind,
  getVersionLabel,
  getFolderPath,
} from "../helpers/fileNameDetails";
import { formatFileSize } from "../helpers/formatFileSize";
import { fetchDownloadUrl } from "../api/storageApi";
import { downloadFile } from "../helpers/downloadLinks";

interface FilePreviewPanelProps {
  file: StoredFile;
  onClose: () => void;
  onShowInFolder: (folderPath: string) => void;
}

export function FilePreviewPanel({
  file,
  onClose,
  onShowInFolder,
}: FilePreviewPanelProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const kind = getFileKind(file.name);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  function startDownload() {
    setDownloadError(null);
    downloadFile(file.key).catch(() => {
      setDownloadError("The download couldn't start. Try again in a moment.");
    });
  }

  useEffect(() => {
    let isCurrent = true;
    setFileUrl(null);
    fetchDownloadUrl(file.key)
      .then((url) => {
        if (isCurrent) setFileUrl(url);
      })
      .catch(() => {
        // The panel still shows the file details without a preview.
      });
    return () => {
      isCurrent = false;
    };
  }, [file.key]);

  return (
    <aside className="preview-panel">
      <header className="preview-panel__header">
        <h2 title={file.name}>{file.name}</h2>
        <button type="button" onClick={onClose} aria-label="Close preview">
          ✕
        </button>
      </header>

      <div className="preview-panel__media">
        {!fileUrl && <p>Loading preview…</p>}
        {fileUrl && kind === "image" && <img src={fileUrl} alt={file.name} />}
        {fileUrl && kind === "video" && <video src={fileUrl} controls />}
        {fileUrl && kind === "other" && <p>No preview for this file type.</p>}
      </div>

      <dl className="preview-panel__details">
        <dt>Version</dt>
        <dd>{getVersionLabel(file.name) ?? "—"}</dd>
        <dt>Size</dt>
        <dd>{formatFileSize(file.sizeBytes)}</dd>
        <dt>Modified</dt>
        <dd>{new Date(file.lastModified).toLocaleString()}</dd>
        <dt>Path</dt>
        <dd>{file.key}</dd>
      </dl>

      <div className="preview-panel__actions">
        <button type="button" onClick={startDownload}>
          ⬇
        </button>
        {fileUrl && (
          <a href={fileUrl} target="_blank" rel="noreferrer">
            Open full size
          </a>
        )}
        <button
          type="button"
          onClick={() => void navigator.clipboard.writeText(file.key)}
        >
          Copy path
        </button>
        <button
          type="button"
          onClick={() => onShowInFolder(getFolderPath(file.key))}
        >
          Show in folder
        </button>
      </div>
      {downloadError && <p className="form-error">{downloadError}</p>}
    </aside>
  );
}
