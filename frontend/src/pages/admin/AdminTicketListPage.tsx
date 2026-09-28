import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  FilterPill,
  LoadError,
  PriorityBadge,
  ReviewBadge,
  Spinner,
  StatusBadge,
} from "../../components/ui";
import { reviewStateOf } from "../../lib/review-state";
import { timeAgo } from "../../lib/format";
import {
  listAdminTickets,
  type AdminTicketSummary,
  type ReviewFilter,
  type TicketStatus,
} from "../../services/api";

const STATUS_FILTERS: { value: TicketStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

/** AI triage segment — `?review=awaiting` is what the Overview KPI links to. */
const REVIEW_FILTERS: { value: ReviewFilter | "any"; label: string }[] = [
  { value: "any", label: "Any AI state" },
  { value: "awaiting", label: "Needs review" },
  { value: "confirmed", label: "Confirmed" },
];

function isValidStatus(value: string | null): value is TicketStatus {
  return STATUS_FILTERS.some((f) => f.value === value && f.value !== "all");
}

function isValidReview(value: string | null): value is ReviewFilter {
  return REVIEW_FILTERS.some((f) => f.value === value && f.value !== "any");
}

export function AdminTicketListPage() {
  // `?status=` / `?review=` in the URL keep filters shareable (overview cards link here).
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = isValidStatus(searchParams.get("status"))
    ? (searchParams.get("status") as TicketStatus)
    : "all";
  const reviewFilter = isValidReview(searchParams.get("review"))
    ? (searchParams.get("review") as ReviewFilter)
    : "any";

  const [tickets, setTickets] = useState<AdminTicketSummary[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Loading is DERIVED from "have we loaded this exact query yet" — the same
  // pattern AdminAnalyticsPage uses, so no setState runs inside the effect.
  const queryKey = `${statusFilter}|${reviewFilter}|${attempt}`;
  const loading = loadedKey !== queryKey;

  useEffect(() => {
    let cancelled = false;
    listAdminTickets(
      statusFilter === "all" ? undefined : statusFilter,
      reviewFilter === "any" ? undefined : reviewFilter,
    )
      .then((data) => {
        if (cancelled) return;
        setTickets(data);
        setFailed(false);
        setLoadedKey(queryKey);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoadedKey(queryKey);
      });
    return () => {
      cancelled = true;
    };
  }, [statusFilter, reviewFilter, attempt, queryKey]);

  /** Keep the other axis intact when one is picked, so the two combine. */
  function select(axis: "status" | "review", value: string) {
    const next = new URLSearchParams(searchParams);
    if (value === "all" || value === "any") next.delete(axis);
    else next.set(axis, value);
    setSearchParams(next);
  }

  const showError = !loading && failed;
  const showEmpty = !loading && !failed && tickets.length === 0;
  const showTable = !loading && !failed && tickets.length > 0;

  const statusActive = (value: TicketStatus | "all") => value === statusFilter;
  const reviewActive = (value: ReviewFilter | "any") => value === reviewFilter;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="display text-[32px] text-ink sm:text-[40px] lg:text-[48px]">
          Tickets
        </h1>
        <span className="mach text-xs text-panel-500">
          {showTable && `${tickets.length} shown`}
        </span>
      </div>

      <div
        className="mt-4 flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter by status"
      >
        <span className="legend w-10 shrink-0">Status</span>
        {STATUS_FILTERS.map((filter) => (
          <FilterPill
            key={filter.value}
            label={filter.label}
            active={statusActive(filter.value)}
            onClick={() => select("status", filter.value)}
          />
        ))}
      </div>

      <div
        className="mt-2 flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter by AI review state"
      >
        <span className="legend w-10 shrink-0">AI</span>
        {REVIEW_FILTERS.map((filter) => (
          <FilterPill
            key={filter.value}
            label={filter.label}
            active={reviewActive(filter.value)}
            onClick={() => select("review", filter.value)}
          />
        ))}
      </div>

      {loading && (
        <div className="mt-10 flex justify-center text-signal-700">
          <Spinner />
        </div>
      )}

      {showError && (
        <div className="mt-8">
          <LoadError
            message="Could not load tickets."
            onRetry={() => setAttempt((n) => n + 1)}
          />
        </div>
      )}

      {showEmpty && (
        <div className="mt-8 border border-dashed border-panel-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink">No tickets here</p>
          <p className="mt-1 text-sm text-panel-600">
            {reviewFilter !== "any"
              ? "Nothing matches this AI review filter right now."
              : statusFilter === "all"
                ? "Customer tickets will appear as soon as they are submitted."
                : "Nothing matches this status filter right now."}
          </p>
          {reviewFilter !== "any" || statusFilter !== "all" ? (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="mt-4 text-sm font-medium text-route-700 hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      )}

      {showTable && (
        <div className="mt-6 overflow-x-auto border border-panel-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="groove-b border-b border-panel-200 bg-panel-50">
              <tr>
                <th scope="col" className="legend px-4 py-3">Ticket</th>
                <th scope="col" className="legend px-4 py-3">Customer</th>
                <th scope="col" className="legend px-4 py-3">Status</th>
                <th scope="col" className="legend px-4 py-3">AI</th>
                <th scope="col" className="legend px-4 py-3">Priority</th>
                <th scope="col" className="legend px-4 py-3">Category</th>
                <th scope="col" className="legend px-4 py-3 text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="transition-colors hover:bg-panel-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/tickets/${ticket.id}`}
                      className="font-medium text-ink hover:text-route-700"
                    >
                      {ticket.subject}
                    </Link>
                    <span className="mach ml-2 text-[11px] text-panel-500">
                      #{ticket.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-panel-600">
                    {ticket.customer_name}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ReviewBadge state={reviewStateOf(ticket)} />
                  </td>
                  <td className="px-4 py-3">
                    {ticket.priority ? (
                      <PriorityBadge priority={ticket.priority} />
                    ) : (
                      <span className="text-xs text-panel-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-panel-600">
                    {ticket.category ?? (
                      <span className="text-xs text-panel-500">—</span>
                    )}
                  </td>
                  <td className="mach px-4 py-3 text-right text-[11px] text-panel-500">
                    {timeAgo(ticket.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
