/**
 * API service layer.
 * All backend communication goes through this module — never from components
 * directly (architecture.md §6: Component → Hook/Feature Logic → API Service).
 *
 * Auth: the JWT from login/register is stored in localStorage and attached as
 * an `Authorization: Bearer` header on every request (decision D4).
 */

const BASE_URL = "/api";
const TOKEN_KEY = "auth_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token === null) {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/** Error carrying the HTTP status so callers can branch (401 vs 409 vs …). */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** FastAPI errors: `detail` is a string, or a 422 array of { msg } objects. */
function detailToMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail.flatMap((item) =>
      item && typeof item === "object" && "msg" in item
        ? [String((item as { msg: unknown }).msg)]
        : [],
    );
    if (messages.length > 0) return messages.join(" ");
  }
  return "Something went wrong. Please try again.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = (await response.json())?.detail;
    } catch {
      // Non-JSON error body — fall through to the generic message.
    }
    throw new ApiError(response.status, detailToMessage(detail));
  }

  return (await response.json()) as T;
}

// --- Types (mirror the backend response schemas) -----------------------------

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "customer" | "admin";
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high";

export interface Ticket {
  id: number;
  subject: string;
  status: TicketStatus;
  category: string | null;
  priority: TicketPriority | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  sender: "customer" | "admin" | "system";
  content: string;
  created_at: string;
}

export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
}

// --- Calls -------------------------------------------------------------------

export interface HealthResponse {
  status: string;
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export function register(payload: {
  full_name: string;
  email: string;
  password: string;
}): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: {
  email: string;
  password: string;
}): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe(): Promise<User> {
  return request<User>("/auth/me");
}

export function listTickets(): Promise<Ticket[]> {
  return request<Ticket[]>("/tickets");
}

export function createTicket(payload: {
  subject: string;
  message: string;
}): Promise<TicketDetail> {
  return request<TicketDetail>("/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getTicket(id: number): Promise<TicketDetail> {
  return request<TicketDetail>(`/tickets/${id}`);
}

export function addTicketMessage(
  id: number,
  content: string,
): Promise<TicketMessage> {
  return request<TicketMessage>(`/tickets/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}
