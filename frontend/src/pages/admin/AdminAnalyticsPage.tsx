import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Spinner } from "../../components/ui";
import {
  getAdminAnalytics,
  type AdminAnalytics,
  type StatusCounts,
} from "../../services/api";

const WINDOWS = [7, 30, 90] as const;

const STATUS_ENTRIES: { key: keyof StatusCounts; label: string; barClass: string }[] = [
  { key: "open", label: "Open", barClass: "bg-sky-500" },
  { key: "in_progress", label: "In progress", barClass: "bg-amber-500" },
  { key: "resolved", label: "Resolved", barClass: "bg-emerald-500" },
  { key: "closed", label: "Closed", barClass: "bg-slate-400" },
];

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

/** Horizontal bar row shared by the status and category sections. */
function BarRow({
  label,
  count,
  max,
  barClass,
}: {
  label: string;
  count: number;
  max: number;
  barClass: string;
}) {
  const width = max > 0 ? (count / max) * 100 : 0;
  return (
    <li className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs font-medium capitalize text-slate-600">
        {label}
      </span>
      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <span
          className={`block h-full rounded-full ${barClass}`}
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-900">
        {count}
      </span>
    </li>
  );
}

export function AdminAnalyticsPage() {
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [failed, setFailed] = useState(false);

  // No synchronous setState in the effect (lint + portal pattern): the
  // previous window stays on screen while the next one loads, detected by
  // comparing `analytics.days` with the requested `days`.
  useEffect(() => {
    let cancelled = false;
    getAdminAnalytics(days)
      .then((data) => {
        if (cancelled) return;
        setAnalytics(data);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const loading = analytics === null || analytics.days !== days;

  if (loading) {
    if (failed) {
      return (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Could not load analytics. Refresh the page to try again.
        </p>
      );
    }
    return (
      <div className="flex justify-center py-16 text-emerald-600">
        <Spinner />
      </div>
    );
  }

  if (failed || !analytics) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Could not load analytics. Refresh the page to try again.
      </p>
    );
  }

  const windowTickets = analytics.by_day.reduce((sum, day) => sum + day.count, 0);
  const statusMax = Math.max(
    ...STATUS_ENTRIES.map(({ key }) => analytics.by_status[key]),
  );
  const categoryMax = Math.max(
    0,
    ...analytics.by_category.map((entry) => entry.count),
  );
  const dayMax = Math.max(0, ...analytics.by_day.map((day) => day.count));
  const firstDate = analytics.by_day[0]?.date ?? "";
  const lastDate = analytics.by_day[analytics.by_day.length - 1]?.date ?? "";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ticket volume and AI activity — every number computed by the API.
          </p>
        </div>
        <div
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
          role="group"
          aria-label="Time window"
        >
          {WINDOWS.map((window) => (
            <button
              key={window}
              type="button"
              onClick={() => setDays(window)}
              aria-pressed={days === window}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                days === window
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {window}d
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label={`Last ${analytics.days} days`}
          value={windowTickets}
          hint="Tickets created in window"
        />
        <KpiCard
          label="All time"
          value={analytics.total_tickets}
          hint="Tickets ever created"
        />
        <KpiCard
          label="AI completed"
          value={analytics.ai.completed}
          hint="Analyses finished in window"
        />
        <KpiCard
          label="Human-confirmed"
          value={analytics.ai.human_confirmed}
          hint="Replies reviewed by a person"
        />
      </div>

      {windowTickets === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-900">
            No tickets in this window
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Widen the window or create a ticket — the charts update on
            reload.
          </p>
          <Link
            to="/admin/tickets"
            className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
          >
            View all tickets →
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Tickets by status
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              State of tickets created in the window.
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {STATUS_ENTRIES.map(({ key, label, barClass }) => (
                <BarRow
                  key={key}
                  label={label}
                  count={analytics.by_status[key]}
                  max={statusMax}
                  barClass={barClass}
                />
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Tickets by category
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              AI-classified categories in the window.
            </p>
            {analytics.by_category.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Nothing classified yet.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {analytics.by_category.map((entry) => (
                  <BarRow
                    key={entry.category}
                    label={entry.category.replace(/_/g, " ")}
                    count={entry.count}
                    max={categoryMax}
                    barClass="bg-emerald-500"
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {windowTickets > 0 && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Tickets per day
            </h2>
            <span className="text-xs text-slate-500 tabular-nums">
              {firstDate} → {lastDate}
            </span>
          </div>
          <div
            className="mt-4 flex h-36 items-end gap-[2px]"
            role="img"
            aria-label={`Daily ticket volume from ${firstDate} to ${lastDate}, peak ${dayMax}`}
          >
            {analytics.by_day.map((day) => {
              const height = dayMax > 0 ? Math.max((day.count / dayMax) * 100, day.count > 0 ? 4 : 0) : 0;
              return (
                <span
                  key={day.date}
                  className="min-w-0 flex-1 rounded-t-sm bg-emerald-500 transition-opacity hover:opacity-70"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${day.count} ticket${day.count === 1 ? "" : "s"}`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400 tabular-nums">
            <span>{firstDate}</span>
            <span>peak {dayMax}</span>
            <span>{lastDate}</span>
          </div>
        </section>
      )}
    </div>
  );
}
