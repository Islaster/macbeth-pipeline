// An error that's safe to show the person, with the HTTP status to send.
export class AuthError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}
