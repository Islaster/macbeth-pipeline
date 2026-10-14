export type UploadRefusalCode = "naming" | "other";

// An upload the server refused, and why, so the right help can be shown.
export class UploadRefused extends Error {
  readonly code: UploadRefusalCode;

  constructor(message: string, code: UploadRefusalCode) {
    super(message);
    this.code = code;
  }
}

export async function requestUploadUrl(
  folder: string,
  file: File
): Promise<string> {
  const response = await fetch("/api/storage/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, fileName: file.name, sizeBytes: file.size }),
  });

  if (!response.ok) {
    const refusal = (await response.json().catch(() => null)) as {
      error?: string;
      code?: string;
    } | null;
    throw new UploadRefused(
      refusal?.error ?? `The upload could not start (${response.status})`,
      refusal?.code === "naming" ? "naming" : "other"
    );
  }
  return ((await response.json()) as { uploadUrl: string }).uploadUrl;
}

// Sends the file straight to storage. XMLHttpRequest is used because it reports progress.
export function sendFileToStorage(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl);
    request.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream"
    );

    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.floor((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error(`Storage refused the upload (${request.status})`));
    };
    request.onerror = () => reject(new Error("The upload was interrupted."));

    request.send(file);
  });
}
