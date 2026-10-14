import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../../../../../shared/types/user";
import { getSignedInUser } from "../helpers/signedInUser";

// Use after requireSignedIn: only lets the listed roles through.
export function requireRole(...allowedRoles: UserRole[]) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    if (allowedRoles.includes(getSignedInUser(res).role)) {
      next();
      return;
    }
    res.status(403).json({ error: "Your role doesn't have access to this." });
  };
}
