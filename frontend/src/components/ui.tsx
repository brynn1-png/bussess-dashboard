/** Small shared UI primitives used across the portal pages. */

import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import type { ReviewState } from "../lib/review-state";
import type { TicketPriority, TicketStatus } from "../services/api";

/**
 * One stroke weight for every icon in the system. Icons are drawn, never
 * emoji or unicode stand-ins, so they inherit the panel's line language.
 */
export function Icon({
  icon: IconComponent,
  className = "h-4 w-4",
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <IconComponent
      strokeWidth={1.75}
      className={className}
      aria-hidden="true"
      focusable="false"
    />
  );
}

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

/* -------------------------------------------------------------------------- */
/* Palette law — one hue, one meaning. Nothing here is decorative.            */
/* -------------------------------------------------------------------------- */

/** Idle / archived / none. Structure and quiet matter. */
export const plateClass =
  "border border-panel-200 bg-white shadow-[0_1px_2px_rgb(21_24_27/0.06)]";

/** Recessed quiet surface inside a plate (reads as milled into the panel). */
export const insetClass = "border border-panel-200 bg-panel-50";

const CHIP_BASE =
  "legend inline-flex items-center rounded-xs border px-1.5 py-0.5";

/**
 * Ticket status. `open` is unclaimed (neutral), `in_progress` is on the line,
 * `resolved` was settled by a signature (ink), `closed` is archived.
 */
const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "border-panel-300 bg-white text-panel-700",
  in_progress: "border-route-200 bg-route-50 text-route-700",
  resolved: "border-ink bg-ink text-white",
  closed: "border-panel-200 bg-panel-100 text-panel-600",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`${CHIP_BASE} ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

/**
 * Priority is never a hue — it is a count of signal bands wrapped around the
 * carrier, four wide, the way a tagged parcel is read across a room. Unused
 * slots are drawn rather than omitted, so "one band" and "four bands" are
 * legible at a glance in the same footprint.
 */
const PRIORITY_BANDS: Record<TicketPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const filled = PRIORITY_BANDS[priority];
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex items-stretch gap-[2px]" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`block w-[3px] self-stretch ${
              i < filled ? "bg-ink" : "bg-panel-200"
            }`}
            style={{ height: "0.875rem" }}
          />
        ))}
      </span>
      <span className="legend text-panel-700">{priority} priority</span>
    </span>
  );
}

/**
 * AI review state for the triage queue. The chip's *typeface* carries the
 * provenance: Courier is matter the machine printed, Archivo is matter a human
 * owns. Route = waiting on you, ink = someone signed it.
 */
const REVIEW_STYLES = {
  awaiting: "border-route-200 bg-route-50 text-route-700",
  confirmed: "border-ink bg-ink text-white",
  pending: "border-signal-200 bg-signal-50 text-signal-800",
  failed: "border-fault-200 bg-fault-50 text-fault-800",
  none: "border-panel-200 bg-panel-100 text-panel-600",
} as const;

const REVIEW_MACHINE: Record<keyof typeof REVIEW_STYLES, boolean> = {
  awaiting: false,
  confirmed: false,
  pending: true,
  failed: true,
  none: true,
};

const REVIEW_LABELS: Record<keyof typeof REVIEW_STYLES, string> = {
  awaiting: "Needs review",
  confirmed: "Confirmed",
  pending: "Analyzing",
  failed: "AI failed",
  none: "No analysis",
};

export function ReviewBadge({ state }: { state: ReviewState }) {
  return (
    <span
      className={`${CHIP_BASE} ${REVIEW_STYLES[state]} ${
        REVIEW_MACHINE[state] ? "font-mono tracking-[0.04em] font-normal" : ""
      }`}
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
      <label htmlFor={htmlFor} className="legend">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-fault-700" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-panel-600">{hint}</p>
      ) : null}
    </div>
  );
}

/** Fault banner for request-level errors (bad credentials, server failures…). */
export function ErrorAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="border border-fault-200 bg-fault-50 px-4 py-3 text-sm text-fault-800"
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
      className="border border-fault-200 bg-fault-50 px-4 py-3 text-sm text-fault-800"
      role="alert"
    >
      <p>{message}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 border border-fault-300 bg-white px-3.5 py-2 text-sm font-semibold text-fault-800 transition-colors hover:bg-fault-100 disabled:cursor-not-allowed disabled:opacity-60"
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
  "w-full border border-panel-300 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-panel-500 focus:border-route-600";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 bg-route-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-route-700 active:bg-route-800 disabled:cursor-not-allowed disabled:bg-panel-300 disabled:text-panel-600";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 border border-panel-300 bg-white px-4 py-2.5 text-sm font-semibold text-panel-700 transition-colors hover:bg-panel-100 disabled:cursor-not-allowed disabled:opacity-60";

export const dangerButtonClass =
  "inline-flex items-center justify-center gap-2 bg-fault-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-fault-700 disabled:cursor-not-allowed disabled:bg-panel-300 disabled:text-panel-600";

/** Soft, outlined destructive action (remove a tag, drop a row). */
export const quietDangerClass =
  "inline-flex items-center justify-center gap-2 border border-fault-300 bg-white px-4 py-2.5 text-sm font-semibold text-fault-700 transition-colors hover:bg-fault-50 disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Selected/unselected treatment for filter groups. One language for "this is
 * the current selection" — used by every filter row so it is learned once and
 * transfers (critique P2). Selection is a stamped plate, never a rounded pill.
 */
export const activePillClass =
  "border border-ink bg-ink px-3 py-1.5 text-xs font-semibold text-white";

export const inactivePillClass =
  "border border-panel-300 bg-white px-3 py-1.5 text-xs font-semibold text-panel-600 transition-colors hover:bg-panel-100";

/* -------------------------------------------------------------------------- */
/* Notices — one shape per law, so a message is read before it is read.       */
/* -------------------------------------------------------------------------- */

/** Neutral, machine-issued status line (nothing needs doing). */
export const statusNoticeClass =
  "border border-panel-200 bg-panel-50 px-4 py-3 text-sm text-panel-600";

/** Settlement: a human completed something. Ink-outlined, never a candy tint. */
export const successNoticeClass =
  "border border-ink bg-white px-4 py-3 text-sm text-ink";

/** Irreversible / armed-destructive: hazard is never used decoratively. */
export function HazardNotice({ children }: { children: ReactNode }) {
  return (
    <div className="border border-hazard-300 bg-hazard-100">
      <div className="hazard-band h-1.5 w-full" aria-hidden="true" />
      <p className="px-4 py-3 text-sm text-ink" role="status">
        {children}
      </p>
    </div>
  );
}

/** One filter control for a filter row. */
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

/* -------------------------------------------------------------------------- */
/* Provenance — the treatment the whole design turns on.                      */
/* -------------------------------------------------------------------------- */

/**
 * Header strip for machine-authored matter: who printed it, when, and whether
 * a human has signed off yet. Read together with the plate edge — dashed =
 * unsealed, solid = a hand has closed it.
 */
export function MachineHead({
  source,
  sealed,
  stamped,
}: {
  source: string;
  sealed: boolean;
  stamped?: string;
}) {
  return (
    <header className="groove-b flex flex-wrap items-center gap-x-3 gap-y-1 bg-panel-50 px-4 py-2">
      <span className="legend text-panel-700">Machine</span>
      <span className="mach text-[11px] text-panel-600">{source}</span>
      {stamped ? (
        <span className="mach text-[11px] text-panel-500">{stamped}</span>
      ) : null}
      <span
        className={`legend ml-auto border px-1.5 py-0.5 ${
          sealed
            ? "border-ink bg-ink text-white"
            : "border-dashed border-panel-400 bg-white text-panel-700"
        }`}
      >
        {sealed ? "Sealed" : "Unsealed"}
      </span>
    </header>
  );
}

/**
 * The human seal: an ink band struck across machine output. This is the one
 * moment of motion in the system — it wipes in when a reviewer signs off,
 * stamping their initials beside the time.
 */
export function SealBand({
  initials,
  by,
  at,
}: {
  /** Signer's initials; empty on rows sealed before a signer was recorded. */
  initials: string;
  by: string;
  at: string;
}) {
  return (
    <p className="seal-band flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2">
      {initials ? (
        <span
          className="mach border border-white/45 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white"
          aria-hidden="true"
        >
          {initials}
        </span>
      ) : null}
      <span className="legend text-white/75">Confirmed by {by}</span>
      <span className="mach text-[11px] text-white/75">{at}</span>
    </p>
  );
}
