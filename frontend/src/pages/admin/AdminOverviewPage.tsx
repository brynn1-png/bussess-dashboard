import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Icon,
  LoadError,
  PriorityBadge,
  ReviewBadge,
  Spinner,
  StatusBadge,
  primaryButtonClass,
} from "../../components/ui";
import { ArrowRight } from "lucide-react";

import { reviewStateOf } from "../../lib/review-state";
import { timeAgo } from "../../lib/format";
import {
  getAdminOverview,
  type AdminOverview,
} from "../../services/api";

type Load = "loading" | "ready" | "error";

const STATUS_ORDER: (keyof AdminOverview["statuses"])[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];

const STATUS_LABELS: Record<keyof AdminOverview["statuses"], string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_ORDER = ["low", "medium", "high", "urgent"] as const;

/**
 * Priority is a count of bands, never a hue — so its distribution is drawn as
 * a neutral ink ramp that darkens with severity.
 */
const PRIORITY_BAR_COLORS: Record<(typeof PRIORITY_ORDER)[number], string> = {
  low: "bg-panel-400",
  medium: "bg-panel-500",
  high: "bg-panel-700",
  urgent: "bg-ink",
};

type Station = {
  key: string;
  label: string;
  /** Accessible wording: what this node actually counts. */
  counted: string;
  value: number;
  needsYou: boolean;
};

/**
 * The line: five readings off the same queue, mounted on one continuous track.
 * Stages overlap while a carrier travels, so they are readings, not a funnel.
 */
function stationsOf(overview: AdminOverview): Station[] {
  return [
    {
      key: "new",
      label: "New",
      counted: `${overview.statuses.open} tickets open and unworked`,
      value: overview.statuses.open,
      needsYou: false,
    },
    {
      key: "analyze",
      label: "Analyze",
      counted: `${overview.ai.pending} analyses queued at the machine`,
      value: overview.ai.pending,
      needsYou: false,
    },
    {
      key: "review",
      label: "Review",
      counted: `${overview.ai.awaiting_review} analyses awaiting a human`,
      value: overview.ai.awaiting_review,
      needsYou: true,
    },
    {
      key: "reply",
      label: "Reply",
      counted: `${overview.statuses.in_progress} tickets in progress`,
      value: overview.statuses.in_progress,
      needsYou: false,
    },
    {
      key: "closed",
      label: "Closed",
      counted: `${overview.statuses.closed} tickets closed`,
      value: overview.statuses.closed,
      needsYou: false,
    },
  ];
}

export function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [state, setState] = useState<Load>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getAdminOverview()
      .then((data) => {
        if (cancelled) return;
        setOverview(data);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (state === "loading") {
    return (
      <div className="flex justify-center py-16 text-signal-700">
        <Spinner />
      </div>
    );
  }

  if (state === "error" || !overview) {
    return (
      <LoadError
        message="Could not load the overview."
        onRetry={() => {
          setState("loading");
          setAttempt((n) => n + 1);
        }}
      />
    );
  }

  const priorityTotal = PRIORITY_ORDER.reduce(
    (sum, key) => sum + overview.priorities[key],
    0,
  );
  const aiFailed = overview.ai.failed > 0;
  const stations = stationsOf(overview);

  return (
    <div>
      {/* Title sits directly on the aluminium — no box, no eyebrow. */}
      <h1 className="display text-[40px] text-ink sm:text-[52px] lg:text-[64px]">
        Ticket line
      </h1>
      <p className="mach mt-3 text-xs text-panel-500">
        {overview.total_tickets} tickets · {overview.total_customers} customers ·
        avg priority{" "}
        {overview.avg_priority === null
          ? "—"
          : `${overview.avg_priority.toFixed(1)} / 4`}
      </p>
      <p className="mt-2 max-w-xl text-sm text-panel-600">
        Live numbers across every customer, computed by the API.
      </p>

      {/* ---- The line: five mounted nodes on one continuous track ---------- */}
      <section className="mt-8" aria-labelledby="line-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="line-heading" className="legend">
            Stations
          </h2>
          <span className="mach text-[11px] text-panel-500">
            {overview.total_tickets} carriers
          </span>
        </div>

        <ol className="relative mt-3 grid grid-cols-5">
          {stations.map((station) => (
            <li key={station.key} className="flex flex-col px-1">
              <span className="relative flex w-full items-center justify-center py-2">
                {/* Continuous track drawn per cell → runs edge to edge. */}
                <span
                  className="track absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2"
                  aria-hidden="true"
                />
                <span
                  aria-hidden="true"
                  className={`relative flex h-14 w-full max-w-[7.5rem] items-center justify-center border ${
                    station.needsYou
                      ? "border-route-600 bg-route-600"
                      : "border-panel-300 bg-white"
                  }`}
                >
                  <span
                    className={`display tabular-nums text-[26px] sm:text-[34px] lg:text-[44px] ${
                      station.needsYou ? "text-white" : "text-ink"
                    }`}
                  >
                    {station.value}
                  </span>
                </span>
              </span>
              <span
                className={`legend mt-2 text-center ${
                  station.needsYou ? "text-route-700" : ""
                }`}
              >
                <span className="sr-only">{station.counted}. </span>
                {station.label}
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-3 text-xs text-panel-500">
          Live readings off one queue — a carrier counts at every stage it
          currently satisfies.
        </p>
      </section>

      {/* ---- Primary action + status routes -------------------------------- */}
      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          to="/admin/tickets?review=awaiting"
          className={`${primaryButtonClass} shrink-0`}
        >
          Open review queue
          <Icon icon={ArrowRight} className="h-4 w-4" />
        </Link>
        <nav
          aria-label="Filter tickets by status"
          className="mach flex flex-wrap items-center gap-2 text-xs"
        >
          {STATUS_ORDER.map((key) => (
            <Link
              key={key}
              to={`/admin/tickets?status=${key}`}
              className="inline-flex items-center gap-1.5 border border-panel-300 bg-white px-2.5 py-2 text-panel-600 transition-colors hover:bg-panel-100"
            >
              {STATUS_LABELS[key]}
              <span className="font-semibold tabular-nums text-ink">
                {overview.statuses[key]}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="legend">Recent tickets</h2>
          <Link
            to="/admin/tickets"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-route-700 hover:underline"
          >
            View all
            <Icon icon={ArrowRight} className="h-3.5 w-3.5" />
          </Link>
        </div>
        {overview.recent_tickets.length === 0 ? (
          <div className="mt-3 border border-dashed border-panel-300 bg-white px-6 py-10 text-center">
            <p className="text-sm text-panel-600">
              No tickets yet — activity will show up here as customers reach
              out.
            </p>
          </div>
        ) : (
          <ul className="mt-3 border border-panel-200 bg-white pt-0.5">
            {overview.recent_tickets.map((ticket, index) => (
              <li
                key={ticket.id}
                className={`border-b border-panel-200 last:border-b-0 ${
                  index === 0
                    ? "relative z-10 -translate-y-0.5 shadow-[0_6px_14px_-10px_rgb(21_24_27/0.55)]"
                    : ""
                }`}
              >
                <Link
                  to={`/admin/tickets/${ticket.id}`}
                  className="block transition-colors hover:bg-panel-50"
                >
                  <div className="grid grid-cols-[3.25rem_1fr] gap-x-3 px-3 py-2.5 sm:grid-cols-[4.25rem_1fr_auto] sm:items-center">
                    <span className="mach pt-0.5 text-xs text-panel-500 sm:pt-0">
                      #{ticket.id}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[16px] leading-snug text-ink">
                        {ticket.subject}
                      </p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-panel-500">
                        <span className="truncate">{ticket.customer_name}</span>
                        <StatusBadge status={ticket.status} />
                        {ticket.priority && (
                          <PriorityBadge priority={ticket.priority} />
                        )}
                      </p>
                    </div>
                    <div className="col-start-2 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:col-start-3 sm:mt-0 sm:justify-end">
                      <ReviewBadge state={reviewStateOf(ticket)} />
                      <span className="mach shrink-0 text-[11px] text-panel-500">
                        {timeAgo(ticket.created_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="border border-panel-200 bg-white p-5">
          <h2 className="legend">Priority distribution</h2>
          {priorityTotal === 0 ? (
            <p className="mt-3 text-sm text-panel-500">
              No priorities assigned yet — they appear once tickets are
              analyzed.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {PRIORITY_ORDER.map((key) => {
                const count = overview.priorities[key];
                const width =
                  priorityTotal > 0 ? (count / priorityTotal) * 100 : 0;
                return (
                  <li key={key} className="flex items-center gap-3">
                    <span className="legend w-16 shrink-0">{key}</span>
                    <span className="h-2.5 flex-1 overflow-hidden bg-panel-100">
                      <span
                        className={`block h-full ${PRIORITY_BAR_COLORS[key]}`}
                        style={{ width: `${width}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-ink">
                      {count}
                    </span>
                  </li>
                );
              })}
              <li className="flex items-center gap-3 border-t border-panel-100 pt-3">
                <span className="legend w-16 shrink-0">none</span>
                <span className="flex-1 text-xs text-panel-500">
                  No priority assigned
                </span>
                <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-ink">
                  {overview.priorities.unassigned}
                </span>
              </li>
            </ul>
          )}
        </section>

        <section className="border border-panel-200 bg-white p-5">
          <h2 className="legend">AI analysis pipeline</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-panel-50 px-3 py-2.5">
              <dt className="text-xs text-panel-500">Completed</dt>
              <dd className="text-lg font-bold tabular-nums text-ink">
                {overview.ai.completed}
              </dd>
            </div>
            <div className="bg-signal-50 px-3 py-2.5">
              <dt className="text-xs text-signal-800">Pending</dt>
              <dd className="text-lg font-bold tabular-nums text-signal-800">
                {overview.ai.pending}
              </dd>
            </div>
            <div
              className={`px-3 py-2.5 ${aiFailed ? "bg-fault-50" : "bg-panel-50"}`}
            >
              <dt className={`text-xs ${aiFailed ? "text-fault-700" : "text-panel-500"}`}>
                Failed
              </dt>
              <dd
                className={`text-lg font-bold tabular-nums ${aiFailed ? "text-fault-700" : "text-ink"}`}
              >
                {overview.ai.failed}
              </dd>
            </div>
            {/* Settled by a signature — the only cell allowed to read as ink. */}
            <div className="bg-ink px-3 py-2.5">
              <dt className="text-xs text-white/70">Human-confirmed</dt>
              <dd className="text-lg font-bold tabular-nums text-white">
                {overview.ai.human_confirmed}
              </dd>
            </div>
          </dl>
        </section>
      </div>

    </div>
  );
}
