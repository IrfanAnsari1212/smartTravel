const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

const getDefaultApiBaseUrl = () => {
  return "/api";
};

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

  // If running in browser on a production domain (not localhost), ignore any localhost envUrl
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    if (envUrl && (envUrl.includes("localhost") || envUrl.includes("127.0.0.1"))) {
      return "/api";
    }
  }

  if (envUrl) {
    const trimmed = trimTrailingSlash(envUrl);
    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
  }

  return getDefaultApiBaseUrl();
};

export const API_BASE_URL = resolveApiBaseUrl();

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
