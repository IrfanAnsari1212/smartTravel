const trimTrailingSlash = (value) => value.replace(/\/+$/, "");
const getDefaultApiBaseUrl = () => {
  if (typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app")) {
    return "/_/backend/api";
  }

  return "/api";
};

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl()
);

export const AUTH_STORAGE_KEY = "smart-travel-session-v1";

export const getStoredSession = () => {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const storeSession = (session) => {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearStoredSession = () => {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};
