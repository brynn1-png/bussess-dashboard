import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  PriorityBadge,
  Spinner,
  StatusBadge,
} from "../../components/ui";
import { timeAgo } from "../../lib/format";
import {
  getAdminOverview,
  type AdminOverview,
} from "../../services/api";

type Load = "loading" | "ready" | "error";

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const STATUS_ENTRIES: { key: keyof AdminOverview["statuses"]; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

const PRIORITY_ORDER = ["low", "medium", "high", "urgent"] as const;

const PRIORITY_BAR_COLORS: Record<(typeof PRIORITY_ORDER)[number], string> = {
  low: "bg-slate-400",
  medium: "bg-amber-500",
  high: "bg-red-500",
  urgent: "bg-red-700",
};

export function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [state, setState] = useState<Load>("loading");

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
  }, []);

  if (state === "loading") {
    return (
      <div className="flex justify-center py-16 text-emerald-600">
        <Spinner />
      </div>
    );
  }

  if (state === "error" || !overview) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Could not load the overview. Refresh the page to try again.
      </p>
    );
  }

  const priorityTotal = PRIORITY_ORDER.reduce(
    (sum, key) => sum + overview.priorities[key],
    0,
  );
  const aiFailed = overview.ai.failed > 0;

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-slate-900">
        Overview
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Live numbers across every customer, computed by the API.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Tickets" value={overview.total_tickets} />
        <KpiCard label="Customers" value={overview.total_customers} />
        <KpiCard
          label="Avg priority"
          value={
            overview.avg_priority === null
              ? "—"
              : `${overview.avg_priority.toFixed(1)} / 4`
          }
          hint="1 low · 4 urgent"
        />
        <KpiCard
          label="Awaiting review"
          value={overview.ai.awaiting_review}
          hint="AI finished, not confirmed"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUS_ENTRIES.map(({ key, label }) => (
          <Link
            key={key}
            to={`/admin/tickets?status=${key}`}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
              {overview.statuses[key]}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Priority distribution
          </h2>
          {priorityTotal === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No priorities assigned yet — they appear once tickets are analyzed.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {PRIORITY_ORDER.map((key) => {
                const count = overview.priorities[key];
                const width =
                  priorityTotal > 0 ? (count / priorityTotal) * 100 : 0;
                return (
                  <li key={key} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-xs font-medium capitalize text-slate-600">
                      {key}
                    </span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className={`block h-full rounded-full ${PRIORITY_BAR_COLORS[key]}`}
                        style={{ width: `${width}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-900">
                      {count}
                    </span>
                  </li>
                );
              })}
              <li className="flex items-center gap-3 border-t border-slate-100 pt-3">
                <span className="w-16 shrink-0 text-xs font-medium text-slate-500">
                  none
                </span>
                <span className="flex-1 text-xs text-slate-500">
                  No priority assigned
                </span>
                <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-900">
                  {overview.priorities.unassigned}
                </span>
              </li>
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            AI analysis pipeline
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 px-3 py-2.5">
              <dt className="text-xs text-slate-500">Completed</dt>
              <dd className="text-lg font-bold tabular-nums text-slate-900">
                {overview.ai.completed}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2.5">
              <dt className="text-xs text-slate-500">Pending</dt>
              <dd className="text-lg font-bold tabular-nums text-slate-900">
                {overview.ai.pending}
              </dd>
            </div>
            <div
              className={`rounded-lg px-3 py-2.5 ${aiFailed ? "bg-red-50" : "bg-slate-50"}`}
            >
              <dt className="text-xs text-slate-500">Failed</dt>
              <dd
                className={`text-lg font-bold tabular-nums ${aiFailed ? "text-red-700" : "text-slate-900"}`}
              >
                {overview.ai.failed}
              </dd>
            </div>
            <div className="rounded-lg bg-emerald-50 px-3 py-2.5">
              <dt className="text-xs text-slate-600">Human-confirmed</dt>
              <dd className="text-lg font-bold tabular-nums text-emerald-800">
                {overview.ai.human_confirmed}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Recent tickets
          </h2>
          <Link
            to="/admin/tickets"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            View all →
          </Link>
        </div>
        {overview.recent_tickets.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-sm text-slate-600">
              No tickets yet — activity will show up here as customers reach
              out.
            </p>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2.5">
            {overview.recent_tickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  to={`/admin/tickets/${ticket.id}`}
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
                    {ticket.priority && (
                      <PriorityBadge priority={ticket.priority} />
                    )}
                    <span className="text-xs text-slate-500">
                      {ticket.customer_name} · #{ticket.id}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
