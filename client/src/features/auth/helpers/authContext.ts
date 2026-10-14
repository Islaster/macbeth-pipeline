import { createContext } from "react";
import type { User } from "../../../../../shared/types/user";

export interface AuthState {
  user: User | null; // null when signed out
  isLoading: boolean; // true while checking for an existing session
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthState | null>(null);
