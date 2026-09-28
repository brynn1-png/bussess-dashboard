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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="display text-[32px] text-ink sm:text-[40px] lg:text-[48px]">
          Your tickets
        </h1>
        <Link to="/portal/new" className={primaryButtonClass}>
          New ticket
        </Link>
      </div>

      {state === "loading" && (
        <div className="mt-10 flex justify-center text-signal-700">
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
        <div className="mt-10 border border-dashed border-panel-300 bg-white px-6 py-12 text-center">
          <p className="legend">No tickets yet</p>
          <p className="mt-2 text-sm text-panel-600">
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
        <ul className="mt-6 border border-panel-200 bg-white">
          {tickets.map((ticket, index) => (
            <li
              key={ticket.id}
              className={`border-b border-panel-200 last:border-b-0 ${
                index === 0
                  ? "relative z-10 shadow-[0_6px_14px_-10px_rgb(21_24_27/0.55)]"
                  : ""
              }`}
            >
              <Link
                to={`/portal/tickets/${ticket.id}`}
                className="block p-4 transition-colors hover:bg-panel-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 truncate text-[16px] leading-snug text-ink">
                    {ticket.subject}
                  </span>
                  <span className="mach shrink-0 text-[11px] text-panel-500">
                    {timeAgo(ticket.created_at)}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <StatusBadge status={ticket.status} />
                  {ticket.priority && <PriorityBadge priority={ticket.priority} />}
                  <span className="mach text-[11px] text-panel-500">
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
