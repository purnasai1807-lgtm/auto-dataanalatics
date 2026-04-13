import axios from "axios";

const TOKEN_KEY = "insightforge-token";
const USER_KEY = "insightforge-user";
const RAILWAY_PUBLIC_API_BASE_URL = "https://auto-analytics-backend-production.up.railway.app/api";

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (typeof configuredBaseUrl === "string" && configuredBaseUrl.trim()) {
    return configuredBaseUrl;
  }

  if (typeof window !== "undefined" && window.location.hostname === "auto-analytics-frontend-production.up.railway.app") {
    return RAILWAY_PUBLIC_API_BASE_URL;
  }

  return "/api";
}

export const http = axios.create({
  baseURL: resolveApiBaseUrl()
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setStoredUser(user: unknown) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser<T>() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }

    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function hasUpgradeRequired(error: unknown) {
  return axios.isAxiosError(error) && Boolean(error.response?.data?.details?.upgradeRequired);
}
