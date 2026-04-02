import axios from "axios";

const DEFAULT_DEV_API_URL = "http://localhost:3000";
const DEFAULT_PROD_API_URL = "https://reelbites-1gw7.onrender.com";
const AUTH_TOKEN_STORAGE_KEY = "foodreel_auth_token";

function normalizeUrl(url = "") {
  return url.trim().replace(/\/$/, "");
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
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

export function getStoredAuthToken() {
  if (!canUseStorage()) {
    return "";
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
}

export function storeAuthToken(token = "") {
  if (!canUseStorage()) {
    return;
  }

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function clearStoredAuthToken() {
  storeAuthToken("");
}

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getStoredAuthToken();

  if (!token) {
    return config;
  }

  config.headers = config.headers || {};

  if (!config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
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
