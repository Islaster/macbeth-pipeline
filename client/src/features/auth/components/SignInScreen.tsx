import { useState } from "react";
import { signIn } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";

export function SignInScreen() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setIsSubmitting(true);
    try {
      setUser(await signIn(email, password));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
      setIsSubmitting(false);
    }
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
        <h1>Sign in</h1>
        <label className="form-field">
          Email
          <input
            className="text-input"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="form-field">
          Password
          <input
            className="text-input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
        <p className="auth-card__hint">
          Need an account? Ask a creative lead to invite you.
        </p>
      </form>
    </main>
  );
}
