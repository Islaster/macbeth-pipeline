import type { UploadItem } from "../helpers/uploads";

interface UploadTrayProps {
  uploads: UploadItem[];
  onClearFinished: () => void;
}

export function UploadTray({ uploads, onClearFinished }: UploadTrayProps) {
  if (uploads.length === 0) return null;

  return (
    <aside className="upload-tray" aria-live="polite">
      <header className="upload-tray__header">
        <strong>Uploads</strong>
        <button type="button" onClick={onClearFinished}>
          Clear finished
        </button>
      </header>
      {uploads.map((upload) => (
        <div key={upload.id} className="upload-tray__item">
          <span
            className="upload-tray__name"
            title={`${upload.folder}${upload.fileName}`}
          >
            {upload.fileName}
          </span>
          {upload.status === "uploading" && (
            <progress
              className="upload-tray__progress"
              max={100}
              value={upload.percent}
            />
          )}
          {upload.status === "done" && (
            <span className="upload-tray__done">Uploaded</span>
          )}
          {upload.status === "failed" && (
            <div className="upload-tray__error" role="alert">
              <strong>Not uploaded.</strong>{" "}
              {upload.error ?? "Something went wrong."}
              {upload.errorDetails && upload.errorDetails.length > 0 && (
                <>
                  <p className="upload-tray__error-heading">What to fix:</p>
                  <ul className="upload-tray__error-details">
                    {upload.errorDetails.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
}
