import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  LoadError,
  Spinner,
  primaryButtonClass,
} from "../../components/ui";
import { timeAgo } from "../../lib/format";
import {
  listWorkflows,
  type Workflow,
  type WorkflowAction,
  type WorkflowCondition,
} from "../../services/api";

type Load = "loading" | "ready" | "error";

function conditionSummary(condition: WorkflowCondition): string {
  const value =
    condition.field === "category" ? `“${condition.value}”` : condition.value;
  return `${condition.field} is ${value}`;
}

function actionSummary(action: WorkflowAction): string {
  switch (action.type) {
    case "set_priority":
      return `Set priority to ${action.value}`;
    case "add_tag":
      return `Add tag “${action.value}”`;
    case "generate_suggested_response":
      return "Generate suggested response";
    case "record_notification":
      return "Record notification";
    default:
      return action.type;
  }
}

function RunCounts({ workflow }: { workflow: Workflow }) {
  const { success, failed, skipped } = workflow.run_counts;
  const total = success + failed + skipped;
  if (total === 0) {
    return <span className="mach text-[11px] text-panel-500">No runs yet</span>;
  }
  const chips: { label: string; count: number; className: string }[] = [
    { label: "ok", count: success, className: "border-panel-300 bg-white text-panel-700" },
    { label: "failed", count: failed, className: "border-fault-200 bg-fault-50 text-fault-700" },
    { label: "skipped", count: skipped, className: "border-panel-200 bg-panel-100 text-panel-600" },
  ];
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {chips
        .filter((chip) => chip.count > 0)
        .map((chip) => (
          <span
            key={chip.label}
            className={`inline-flex items-center border px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${chip.className}`}
          >
            {chip.count} {chip.label}
          </span>
        ))}
    </div>
  );
}

export function AdminWorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [state, setState] = useState<Load>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listWorkflows()
      .then((data) => {
        if (cancelled) return;
        setWorkflows(data);
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

  if (state === "error") {
    return (
      <LoadError
        message="Could not load workflows."
        onRetry={() => {
          setState("loading");
          setAttempt((n) => n + 1);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="display text-[32px] text-ink sm:text-[40px] lg:text-[48px]">
            Workflows
          </h1>
          <p className="mt-2 max-w-xl text-sm text-panel-600">
            Automations that run when a ticket is created — conditions in,
            actions out.
          </p>
        </div>
        <Link to="/admin/workflows/new" className={`shrink-0 ${primaryButtonClass}`}>
          New workflow
        </Link>
      </div>

      {workflows.length === 0 ? (
        <div className="mt-6 border border-dashed border-panel-300 bg-white px-6 py-12 text-center">
          <p className="legend">No workflows yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-panel-600">
            Create one to tag, prioritize, or notify on every new ticket — for
            example: escalate anything urgent and post a heads-up on the
            ticket.
          </p>
          <Link
            to="/admin/workflows/new"
            className={`mt-5 inline-flex ${primaryButtonClass}`}
          >
            Create your first workflow
          </Link>
        </div>
      ) : (
        <ul className="mt-6 border border-panel-200 bg-white">
          {workflows.map((workflow, index) => (
            <li
              key={workflow.id}
              className={`border-b border-panel-200 last:border-b-0 ${
                index === 0
                  ? "relative z-10 shadow-[0_6px_14px_-10px_rgb(21_24_27/0.55)]"
                  : ""
              }`}
            >
              <Link
                to={`/admin/workflows/${workflow.id}`}
                className="block p-5 transition-colors hover:bg-panel-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[16px] font-semibold text-ink">
                        {workflow.name}
                      </span>
                      <span
                        className={`inline-flex items-center border px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                          workflow.is_active
                            ? "border-route-200 bg-route-50 text-route-700"
                            : "border-panel-200 bg-panel-100 text-panel-600"
                        }`}
                      >
                        {workflow.is_active ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p className="mach mt-1.5 text-[11px] leading-relaxed text-panel-600">
                      When a ticket is created
                      {workflow.conditions.length > 0 &&
                        ` · if ${workflow.conditions.map(conditionSummary).join(" and ")}`}
                      {" → "}
                      {workflow.actions.map(actionSummary).join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <RunCounts workflow={workflow} />
                    <span className="mach text-[11px] text-panel-500">
                      {timeAgo(workflow.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
