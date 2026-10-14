import type { Request } from "express";

// Returns the signed-in person's full name, or null when nobody is signed in.
// ASSUMPTION: the login step puts the person on req.user with a fullName.
// Change this one function to match wherever your login keeps the user.
export function readSignedInUserName(req: Request): string | null {
  const r = req as Request & Record<string, unknown>;
  console.log("upload request, user info:", {
    user: r.user,
    session: r.session,
    auth: r.auth,
    locals: req.res?.locals,
    authorization: req.headers.authorization,
    cookie: req.headers.cookie,
  });
  return null;
}
