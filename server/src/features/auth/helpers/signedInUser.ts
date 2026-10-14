import type { Response } from "express";
import type { User } from "../../../../../shared/types/user";

// requireSignedIn stores the user here; routes behind it read it back.
export function setSignedInUser(res: Response, user: User): void {
  res.locals.user = user;
}

export function getSignedInUser(res: Response): User {
  return res.locals.user as User;
}
