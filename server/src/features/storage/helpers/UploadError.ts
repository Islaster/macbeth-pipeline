// Why an upload was refused, so the client can react (for example show the naming help).
export type UploadErrorCode = "naming" | "other";

// A refused upload, with a message that's safe to show the person.
export class UploadError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: UploadErrorCode = "other"
  ) {
    super(message);
  }
}
