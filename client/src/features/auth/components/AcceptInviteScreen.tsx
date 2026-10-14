import { useEffect, useState } from "react";
import type { InviteDetails } from "../../../../../shared/types/user";
import { acceptInvite, lookupInvite } from "../api/authApi";

const minPasswordLength = 12; // the server enforces this too

export function AcceptInviteScreen({ token }: { token: string }) {
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    lookupInvite(token)
      .then((found) => {
        if (isCurrent) setInvite(found);
      })
      .catch((cause: unknown) => {
        if (isCurrent)
          setError(
            cause instanceof Error
              ? cause.message
              : "This invite could not be checked."
          );
      })
      .finally(() => {
        if (isCurrent) setIsChecking(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [token]);

  async function submit() {
    if (password !== confirmPassword) {
      setError("The two passwords don't match.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await acceptInvite(token, password);
      window.location.replace("/"); // the account exists and is signed in, so load the app
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not create your account."
      );
      setIsSubmitting(false);
    }
  }

  if (isChecking) {
    return (
      <main className="auth-screen">
        <p>Checking your invite…</p>
      </main>
    );
  }

  if (!invite) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <h1>Invite not available</h1>
          <p className="form-error">{error}</p>
          <p className="auth-card__hint">
            <a href="/">Go to sign in</a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-screen">
      <form
        className="auth-card"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <h1>Welcome, {invite.name}</h1>
        <p className="auth-card__hint">
          Set a password for {invite.email}. It needs at least{" "}
          {minPasswordLength} characters.
        </p>
        <label className="form-field">
          Password
          <input
            className="text-input"
            type="password"
            autoComplete="new-password"
            required
            minLength={minPasswordLength}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className="form-field">
          Confirm password
          <input
            className="text-input"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="primary-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </main>
  );
}
