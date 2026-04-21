import React from "react";

import type { AuthSessionState } from "@/features/auth/types";

const AuthSessionContext = React.createContext<AuthSessionState | null>(null);

type AuthSessionProviderProps = {
  children: React.ReactNode;
  value: AuthSessionState;
};

export function AuthSessionProvider({
  children,
  value,
}: AuthSessionProviderProps) {
  return React.createElement(AuthSessionContext.Provider, {
    children,
    value,
  });
}

export function useAuthSession() {
  const value = React.use(AuthSessionContext);

  if (!value) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }

  return value;
}
