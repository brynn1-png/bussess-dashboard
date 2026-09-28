import type { AdminTicketSummary } from "../services/api";

/**
 * Where a ticket sits in the AI triage queue — the one thing a list needs to
 * say about the analysis without opening the ticket.
 *
 * The vocabulary lives here so the badge component and every consumer share a
 * single source of truth.
 */
export type ReviewState =
  | "awaiting"
  | "confirmed"
  | "pending"
  | "failed"
  | "none";

/**
 * Badge state from the API's two nullable AI fields:
 * `analysis_status === null` means the ticket has no analysis at all.
 */
export function reviewStateOf(ticket: AdminTicketSummary): ReviewState {
  if (ticket.analysis_status === null || ticket.is_human_confirmed === null) {
    return "none";
  }
  if (ticket.analysis_status === "failed") return "failed";
  if (ticket.analysis_status === "pending") return "pending";
  return ticket.is_human_confirmed ? "confirmed" : "awaiting";
}
