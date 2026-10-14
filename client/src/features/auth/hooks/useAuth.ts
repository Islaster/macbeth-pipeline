import { useContext } from "react";
import { AuthContext, type AuthState } from "../helpers/authContext";

export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside AuthGate");
  return auth;
}
