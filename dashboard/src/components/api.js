import axios from "axios";

/**
 * In-memory access token store.
 * Intentionally NOT localStorage/sessionStorage:
 *  - not readable by XSS-injected scripts
 *  - session ends when the tab closes
 */
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3002",
});

// Attach "Authorization: Bearer <token>" to every outgoing request
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 from the API means the token is missing/expired/invalid — drop it
api.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401) {
    clearAccessToken();
  }
  return Promise.reject(error);
});

export default api;
