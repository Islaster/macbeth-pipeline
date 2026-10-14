import type { Response } from "express";
import { authConfig } from "../config/authConfig";

export function setSessionCookie(
  res: Response,
  token: string,
  expiresAt: Date
): void {
  res.cookie(authConfig.sessionCookieName, token, {
    httpOnly: true, // page scripts can't read it
    secure: authConfig.isProduction, // HTTPS only in production
    sameSite: "lax", // other sites can't make signed-in requests on someone's behalf
    expires: expiresAt,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(authConfig.sessionCookieName, { path: "/" });
}
