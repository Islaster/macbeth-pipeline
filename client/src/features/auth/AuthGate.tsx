import type { ReactNode } from "react";
import { AcceptInviteScreen } from "./components/AcceptInviteScreen";
import { AuthProvider } from "./components/AuthProvider";
import { SignInScreen } from "./components/SignInScreen";
import { readInviteToken } from "./helpers/readInviteToken";
import { useAuth } from "./hooks/useAuth";
import "./auth.css";

function GateContent({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const inviteToken = readInviteToken();

  if (inviteToken) return <AcceptInviteScreen token={inviteToken} />;
  if (isLoading)
    return (
      <main className="auth-screen">
        <p>Loading…</p>
      </main>
    );
  if (!user) return <SignInScreen />;
  return <>{children}</>;
}

// Wrap the app in this: everything inside is only shown to signed-in people.
export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <GateContent>{children}</GateContent>
    </AuthProvider>
  );
}
