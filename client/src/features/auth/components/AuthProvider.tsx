import { useEffect, useState, type ReactNode } from "react";
import type { User } from "../../../../../shared/types/user";
import { fetchCurrentUser } from "../api/authApi";
import { AuthContext } from "../helpers/authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On load, ask the server whether this browser is already signed in.
  useEffect(() => {
    let isCurrent = true;
    fetchCurrentUser()
      .then((found) => {
        if (isCurrent) setUser(found);
      })
      .catch(() => {
        // Treated as signed out; the sign-in screen is shown.
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
