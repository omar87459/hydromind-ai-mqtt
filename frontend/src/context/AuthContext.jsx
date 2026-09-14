import { createContext, useContext, useState } from "react";
import { postLogin } from "../api";

const AuthContext = createContext(null);

const STORAGE_KEY = "hydromind_auth";

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loginError, setLoginError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  async function login(username, password) {
    setLoggingIn(true);
    setLoginError(null);
    try {
      const result = await postLogin(username, password);
      const nextUser = { username: result.username, role: result.role, token: result.token };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      return true;
    } catch (err) {
      setLoginError(
        err.response?.status === 401
          ? "Invalid username or password."
          : err.message || "Could not reach the HydroMind AI backend."
      );
      return false;
    } finally {
      setLoggingIn(false);
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login,
    logout,
    loginError,
    loggingIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
