import React, { createContext, useContext, useEffect, useState } from "react";

import api from "../lib/api";

const AuthContext = createContext(null);

function getLogoutEndpoint(accountType) {
  if (accountType === "foodPartner") {
    return "/api/auth/food-partner/logout";
  }

  return "/api/auth/user/logout";
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    refreshSession();
  }, []);

  async function refreshSession() {
    try {
      const response = await api.get("/api/auth/me");
      const user = response.data.user || null;

      setCurrentUser(user);
      setIsAuthResolved(true);

      return user;
    } catch (error) {
      setCurrentUser(null);
      setIsAuthResolved(true);

      return null;
    }
  }

  async function logout() {
    if (isLoggingOut) {
      return false;
    }

    if (!currentUser?.accountType) {
      setCurrentUser(null);
      setIsAuthResolved(true);
      return true;
    }

    setIsLoggingOut(true);

    try {
      await api.post(getLogoutEndpoint(currentUser.accountType));

      setCurrentUser(null);
      setIsAuthResolved(true);

      return true;
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthResolved,
        isLoggedIn: Boolean(currentUser),
        isLoggingOut,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
