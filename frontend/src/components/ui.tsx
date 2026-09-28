/** Small shared UI primitives used across the portal pages. */

import type { ReactNode } from "react";

import type { TicketPriority, TicketStatus } from "../services/api";

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  );
}

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-sky-100 text-sky-800",
  in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-slate-200 text-slate-700",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
  urgent: "bg-red-600 text-white",
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLES[priority]}`}
    >
      {priority} priority
    </span>
  );
}

/**
 * AI review state for the triage queue: the one thing a ticket list needs to
 * say about the analysis without opening the ticket.
 */
const REVIEW_STYLES = {
  awaiting: "bg-amber-100 text-amber-800 ring-amber-200",
  confirmed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  pending: "bg-sky-100 text-sky-800 ring-sky-200",
  failed: "bg-red-100 text-red-800 ring-red-200",
  none: "bg-slate-100 text-slate-500 ring-slate-200",
} as const;

const REVIEW_LABELS: Record<keyof typeof REVIEW_STYLES, string> = {
  awaiting: "Needs review",
  confirmed: "Confirmed",
  pending: "Analyzing",
  failed: "AI failed",
  none: "No analysis",
};

export type ReviewState = keyof typeof REVIEW_STYLES;

export function ReviewBadge({
  state,
}: {
  state: ReviewState;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${REVIEW_STYLES[state]}`}
    >
      {REVIEW_LABELS[state]}
    </span>
  );
}

/** Label + control + inline error, with consistent spacing. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

/** Red banner for request-level errors (bad credentials, server failures…). */
export function ErrorAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      {message}
    </div>
  );
}

/**
 * Load failure with an actual retry — replaces the 10 "Refresh the page"
 * strings that pointed at a control the UI never had (critique P1).
 */
export function LoadError({
  message,
  onRetry,
  retrying = false,
  children,
}: {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <p>{message}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3.5 py-2 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {retrying && <Spinner className="h-4 w-4" />}
          {retrying ? "Retrying…" : "Try again"}
        </button>
        {children}
      </div>
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100";

/**
 * Selected/unselected treatment for pill-style filter groups. One language for
 * "this is the current selection" — used by every filter row so it is learned
 * once and transfers (critique P2).
 */
export const activePillClass =
  "rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white";

export const inactivePillClass =
  "rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100";

/** One pill button for a filter row. */
export function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={active ? activePillClass : inactivePillClass}
    >
      {label}
    </button>
  );
}
