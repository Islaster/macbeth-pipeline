import type { NextFunction, Request, Response } from "express";
import { AuthError } from "../helpers/AuthError";

// Turns AuthErrors into clean JSON replies; anything else goes to Express's default handler.
export function handleAuthError(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof AuthError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  next(error);
}
