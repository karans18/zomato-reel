import axios from "axios";

const DEFAULT_DEV_API_URL = "http://localhost:3000";
const DEFAULT_PROD_API_URL = "https://reelbites-1gw7.onrender.com";

function normalizeUrl(url = "") {
  return url.trim().replace(/\/$/, "");
}

function getApiBaseUrl() {
  const explicitApiUrl = normalizeUrl(import.meta.env.VITE_API_URL || "");

  if (explicitApiUrl) {
    return explicitApiUrl;
  }

  if (import.meta.env.DEV) {
    return undefined;
  }

  return DEFAULT_PROD_API_URL;
}

const apiBaseUrl = getApiBaseUrl();

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15000,
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
    return DEFAULT_DEV_API_URL;
  }

  return DEFAULT_PROD_API_URL;
}

export default api;
