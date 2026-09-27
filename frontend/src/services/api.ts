/**
 * API service layer.
 * All backend communication goes through this module — never from components
 * directly (architecture.md §6: Component → Hook/Feature Logic → API Service).
 */

const BASE_URL = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export interface HealthResponse {
  status: string;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};

export function getHealth(): Promise<HealthResponse> {
  return api.get<HealthResponse>("/health");
}
