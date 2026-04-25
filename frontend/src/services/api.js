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
