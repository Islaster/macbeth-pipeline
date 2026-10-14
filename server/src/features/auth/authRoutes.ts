import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { authConfig } from "./config/authConfig";
import { isUserRole } from "./helpers/rolePermissions";
import { clearSessionCookie, setSessionCookie } from "./helpers/sessionCookie";
import { getSignedInUser } from "./helpers/signedInUser";
import { handleAuthError } from "./middleware/handleAuthError";
import { requireSignedIn } from "./middleware/requireSignedIn";
import { acceptInvite } from "./services/acceptInvite";
import { createInvite } from "./services/createInvite";
import { findPendingInvite } from "./services/findPendingInvite";
import { endSession, startSession } from "./services/sessions";
import { signIn } from "./services/signIn";

export const authRoutes = Router();

// Slows down password and invite-link guessing: 10 tries per 15 minutes per address.
const guessLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });

function readText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// POST /api/auth/sign-in  { email, password }
authRoutes.post("/sign-in", guessLimiter, async (req, res) => {
  const user = await signIn(
    readText(req.body?.email),
    readText(req.body?.password)
  );
  const session = await startSession(user.id);
  setSessionCookie(res, session.token, session.expiresAt);
  res.json(user);
});

// POST /api/auth/sign-out
authRoutes.post("/sign-out", async (req, res) => {
  const token: unknown = req.cookies?.[authConfig.sessionCookieName];
  if (typeof token === "string") await endSession(token);
  clearSessionCookie(res);
  res.status(204).end();
});

// GET /api/auth/me  -> the signed-in user, or 401
authRoutes.get("/me", requireSignedIn, (_req, res) => {
  res.json(getSignedInUser(res));
});

// POST /api/auth/invites  { email, name, role }  -> management and leads only
authRoutes.post("/invites", requireSignedIn, async (req, res) => {
  const email = readText(req.body?.email).trim();
  const name = readText(req.body?.name).trim();
  const role: unknown = req.body?.role;

  if (!email.includes("@") || !name || !isUserRole(role)) {
    res
      .status(400)
      .json({ error: "A name, a valid email, and a role are required." });
    return;
  }

  res
    .status(201)
    .json(await createInvite(getSignedInUser(res), { email, name, role }));
});

// POST /api/auth/invites/lookup  { token }  -> who the invite is for, shown on the invite screen
authRoutes.post("/invites/lookup", guessLimiter, async (req, res) => {
  const invite = await findPendingInvite(readText(req.body?.token));
  if (!invite) {
    res
      .status(404)
      .json({ error: "This invite link is invalid or has expired." });
    return;
  }
  res.json({ email: invite.email, name: invite.name, role: invite.role });
});

// POST /api/auth/invites/accept  { token, password }  -> creates the account and signs in
authRoutes.post("/invites/accept", guessLimiter, async (req, res) => {
  const user = await acceptInvite(
    readText(req.body?.token),
    readText(req.body?.password)
  );
  const session = await startSession(user.id);
  setSessionCookie(res, session.token, session.expiresAt);
  res.status(201).json(user);
});

authRoutes.use(handleAuthError);
