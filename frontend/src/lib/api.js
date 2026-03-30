import axios from "axios";

function normalizeUrl(url = "") {
  return url.trim().replace(/\/$/, "");
}

const apiBaseUrl = normalizeUrl(import.meta.env.VITE_API_URL || "");

const api = axios.create({
  baseURL: apiBaseUrl || undefined,
  withCredentials: true,
});

export function getSocketServerUrl() {
  const explicitSocketUrl = normalizeUrl(import.meta.env.VITE_SOCKET_URL || "");

  if (explicitSocketUrl) {
    return explicitSocketUrl;
  }

  if (apiBaseUrl) {
    return apiBaseUrl;
  }

  if (import.meta.env.DEV) {
    return "http://localhost:3000";
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return undefined;
}

export default api;
