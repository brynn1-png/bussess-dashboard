import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { PriorityBadge, Spinner, StatusBadge } from "../../components/ui";
import { timeAgo } from "../../lib/format";
import {
  listAdminTickets,
  type AdminTicketSummary,
  type TicketStatus,
} from "../../services/api";

type Load = "loading" | "ready" | "error";

const FILTERS: { value: TicketStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

function isValidStatus(value: string | null): value is TicketStatus {
  return FILTERS.some((f) => f.value === value && f.value !== "all");
}

export function AdminTicketListPage() {
  // `?status=` in the URL keeps filters shareable (overview cards link here).
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = isValidStatus(searchParams.get("status"))
    ? (searchParams.get("status") as TicketStatus)
    : "all";

  const [tickets, setTickets] = useState<AdminTicketSummary[]>([]);
  const [state, setState] = useState<Load>("loading");

  useEffect(() => {
    let cancelled = false;
    listAdminTickets(statusFilter === "all" ? undefined : statusFilter)
      .then((data) => {
        if (cancelled) return;
        setTickets(data);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  function selectFilter(value: TicketStatus | "all") {
    setSearchParams(value === "all" ? {} : { status: value });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Tickets
        </h1>
        <span className="text-sm text-slate-500">
          {state === "ready" && `${tickets.length} shown`}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {FILTERS.map((filter) => {
          const active = filter.value === statusFilter;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => selectFilter(filter.value)}
              aria-pressed={active}
              className={
                active
                  ? "rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white"
                  : "rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
              }
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {state === "loading" && (
        <div className="mt-10 flex justify-center text-emerald-600">
          <Spinner />
        </div>
      )}

      {state === "error" && (
        <p className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Could not load tickets. Refresh the page to try again.
        </p>
      )}

      {state === "ready" && tickets.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-900">No tickets here</p>
          <p className="mt-1 text-sm text-slate-600">
            {statusFilter === "all"
              ? "Customer tickets will appear as soon as they are submitted."
              : "Nothing matches this status filter right now."}
          </p>
        </div>
      )}

      {state === "ready" && tickets.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/tickets/${ticket.id}`}
                      className="font-medium text-slate-900 hover:text-emerald-700"
                    >
                      {ticket.subject}
                    </Link>
                    <span className="ml-2 text-xs text-slate-400">
                      #{ticket.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {ticket.customer_name}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    {ticket.priority ? (
                      <PriorityBadge priority={ticket.priority} />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {ticket.category ?? (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500 tabular-nums">
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
