import { useAuthStore } from "../store/auth.ts";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (t: string) => void; reject: (e: Error) => void }> = [];

function processQueue(token: string | null, error: Error | null) {
  pendingQueue.forEach(({ resolve, reject }) =>
    token ? resolve(token) : reject(error!)
  );
  pendingQueue = [];
}

async function refreshToken(): Promise<string> {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Session expirée");
  const { accessToken } = await res.json();
  useAuthStore.getState().setAccessToken(accessToken);
  return accessToken;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { accessToken, clearAuth } = useAuthStore.getState();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    // Refresh token une seule fois en parallèle
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) =>
            apiFetch<T>(path, {
              ...options,
              headers: { ...headers, Authorization: `Bearer ${token}` },
            }).then(resolve),
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await refreshToken();
      processQueue(newToken, null);
      return apiFetch<T>(path, options); // réessaie avec le nouveau token
    } catch (err) {
      processQueue(null, err as Error);
      clearAuth();
      window.location.href = "/login";
      throw err;
    } finally {
      isRefreshing = false;
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Erreur inconnue" }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Helpers CRUD
export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path: string) => apiFetch(path, { method: "DELETE" }),
};
