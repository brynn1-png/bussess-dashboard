import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Icon, LoadError, Spinner, activePillClass, inactivePillClass } from "../../components/ui";
import { ArrowRight } from "lucide-react";

import {
  getAdminAnalytics,
  type AdminAnalytics,
  type StatusCounts,
} from "../../services/api";

const WINDOWS = [7, 30, 90] as const;

/**
 * Status hues follow the palette law: in-progress is the line (routing blue),
 * resolved is settled (ink), open and closed are idle (neutral).
 */
const STATUS_ENTRIES: { key: keyof StatusCounts; label: string; barClass: string }[] = [
  { key: "open", label: "Open", barClass: "bg-panel-500" },
  { key: "in_progress", label: "In progress", barClass: "bg-route-500" },
  { key: "resolved", label: "Resolved", barClass: "bg-ink" },
  { key: "closed", label: "Closed", barClass: "bg-panel-300" },
];

type Metric = { label: string; value: string | number; hint: string };

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
      <span className="legend w-28 shrink-0 truncate">{label}</span>
      <span className="h-2.5 flex-1 overflow-hidden bg-panel-100" aria-hidden="true">
        <span
          className={`block h-full ${barClass}`}
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="mach w-8 shrink-0 text-right text-xs font-semibold text-ink">
        {count}
      </span>
    </li>
  );
}

export function AdminAnalyticsPage() {
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

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
  }, [days, attempt]);

  const loading = analytics === null || analytics.days !== days;

  if (loading) {
    if (failed) {
      return (
        <LoadError
          message="Could not load analytics."
          onRetry={() => {
            setFailed(false);
            setAttempt((n) => n + 1);
          }}
        />
      );
    }
    return (
      <div className="flex justify-center py-16 text-signal-700">
        <Spinner />
      </div>
    );
  }

  if (failed || !analytics) {
    return (
      <LoadError
        message="Could not load analytics."
        onRetry={() => {
          setFailed(false);
          setAttempt((n) => n + 1);
        }}
      />
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

  const metrics: Metric[] = [
    {
      label: `Last ${analytics.days} days`,
      value: windowTickets,
      hint: "Tickets created in window",
    },
    {
      label: "All time",
      value: analytics.total_tickets,
      hint: "Tickets ever created",
    },
    {
      label: "AI completed",
      value: analytics.ai.completed,
      hint: "Analyses finished in window",
    },
    {
      label: "Human-confirmed",
      value: analytics.ai.human_confirmed,
      hint: "Replies reviewed by a person",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="display text-[32px] text-ink sm:text-[40px] lg:text-[48px]">
            Analytics
          </h1>
          <p className="mt-2 max-w-xl text-sm text-panel-600">
            Ticket volume and AI activity — every number computed by the API.
          </p>
        </div>
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Time window"
        >
          {WINDOWS.map((window) => (
            <button
              key={window}
              type="button"
              onClick={() => setDays(window)}
              aria-pressed={days === window}
              className={days === window ? activePillClass : inactivePillClass}
            >
              {window}d
            </button>
          ))}
        </div>
      </div>

      {/* Readouts engraved on the line itself — the THESIS refuses the row of
          four identical KPI tiles, so these earn no box of their own. */}
      <dl className="groove-b mt-6 grid grid-cols-1 gap-x-6 gap-y-4 pb-4 sm:grid-cols-4 sm:gap-x-0">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={
              index === 0
                ? ""
                : "border-t border-panel-300 pt-4 sm:border-t-0 sm:border-l sm:pl-5 sm:pt-0"
            }
          >
            <dt className="legend">{metric.label}</dt>
            <dd className="mt-1.5 text-3xl font-extrabold tabular-nums tracking-tight text-ink">
              {metric.value}
            </dd>
            <p className="mt-1 text-[11px] text-panel-500">{metric.hint}</p>
          </div>
        ))}
      </dl>

      {windowTickets === 0 ? (
        <div className="mt-6 border border-dashed border-panel-300 bg-white px-6 py-10 text-center">
          <p className="legend">No tickets in this window</p>
          <p className="mt-2 text-sm text-panel-600">
            Widen the window or create a ticket — the charts update on reload.
          </p>
          <Link
            to="/admin/tickets"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-route-700 hover:underline"
          >
            View all tickets
            <Icon icon={ArrowRight} className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="border border-panel-200 bg-white p-5">
            <h2 className="legend">Tickets by status</h2>
            <p className="mt-1 text-xs text-panel-500">
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

          <section className="border border-panel-200 bg-white p-5">
            <h2 className="legend">Tickets by category</h2>
            <p className="mt-1 text-xs text-panel-500">
              AI-classified categories in the window.
            </p>
            {analytics.by_category.length === 0 ? (
              <p className="mt-4 text-sm text-panel-500">Nothing classified yet.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {analytics.by_category.map((entry) => (
                  <BarRow
                    key={entry.category}
                    label={entry.category.replace(/_/g, " ")}
                    count={entry.count}
                    max={categoryMax}
                    barClass="bg-route-500"
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {windowTickets > 0 && (
        <section className="mt-6 border border-panel-200 bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="legend">Tickets per day</h2>
            <span className="mach text-[11px] text-panel-500">
              {firstDate} – {lastDate}
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
                  className="min-w-0 flex-1 bg-route-500 transition-opacity hover:opacity-70"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${day.count} ticket${day.count === 1 ? "" : "s"}`}
                />
              );
            })}
          </div>
          <div className="mach mt-2 flex justify-between text-[11px] text-panel-500">
            <span>{firstDate}</span>
            <span>peak {dayMax}</span>
            <span>{lastDate}</span>
          </div>
        </section>
      )}
    </div>
  );
}
