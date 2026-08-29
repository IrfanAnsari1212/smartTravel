import { useState } from "react";
import { getSession, login, logout, register } from "../services/authService";

export function useAuth() {
  const [session, setSession] = useState(getSession);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleAuthentication = async (event) => {
    event.preventDefault();
    try {
      setAuthLoading(true);
      setAuthError("");
      const submit = authMode === "register" ? register : login;
      const nextSession = await submit({ email: authEmail, password: authPassword });
      setSession(nextSession);
      setAuthPassword("");
    } catch (error) {
      setAuthError(error.response?.data?.message || "Unable to sign in right now.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = (onLogoutCallback) => {
    logout();
    setSession(null);
    setAuthError("");
    if (onLogoutCallback) {
      onLogoutCallback();
    }
  };

  return {
    session,
    authMode,
    setAuthMode,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authLoading,
    authError,
    setAuthError,
    handleAuthentication,
    handleLogout,
  };
}

