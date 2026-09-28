import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  LoadError,
  PriorityBadge,
  Spinner,
  StatusBadge,
  primaryButtonClass,
} from "../../components/ui";
import { timeAgo } from "../../lib/format";
import { listTickets, type Ticket } from "../../services/api";

type Load = "loading" | "ready" | "error";

export function TicketListPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [state, setState] = useState<Load>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listTickets()
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
  }, [attempt]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Your tickets
        </h1>
        <Link to="/portal/new" className={primaryButtonClass}>
          New ticket
        </Link>
      </div>

      {state === "loading" && (
        <div className="mt-10 flex justify-center text-emerald-600">
          <Spinner />
        </div>
      )}

      {state === "error" && (
        <div className="mt-8">
          <LoadError
            message="Could not load your tickets."
            onRetry={() => {
              setState("loading");
              setAttempt((n) => n + 1);
            }}
          />
        </div>
      )}

      {state === "ready" && tickets.length === 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-900">
            No tickets yet
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Something need fixing or help? Send us a ticket and track it here.
          </p>
          <Link
            to="/portal/new"
            className={`mt-5 ${primaryButtonClass}`}
          >
            Submit your first ticket
          </Link>
        </div>
      )}

      {state === "ready" && tickets.length > 0 && (
        <ul className="mt-6 flex flex-col gap-3">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                to={`/portal/tickets/${ticket.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-semibold text-slate-900">
                    {ticket.subject}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                    {timeAgo(ticket.created_at)}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <StatusBadge status={ticket.status} />
                  {ticket.priority && <PriorityBadge priority={ticket.priority} />}
                  <span className="text-xs text-slate-500">
                    #{ticket.id}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
