import type { NextFunction, Request, Response } from "express";
import { authConfig } from "../config/authConfig";
import { setSignedInUser } from "../helpers/signedInUser";
import { findSessionUser } from "../services/sessions";

// Put this in front of any route that needs a signed-in person.
export async function requireSignedIn(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token: unknown = req.cookies?.[authConfig.sessionCookieName];
  const user = typeof token === "string" ? await findSessionUser(token) : null;

  if (!user) {
    res.status(401).json({ error: "Please sign in." });
    return;
  }

  setSignedInUser(res, user);
  next();
}
