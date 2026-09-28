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
    return <span className="text-xs text-slate-400">No runs yet</span>;
  }
  const chips: { label: string; count: number; className: string }[] = [
    { label: "ok", count: success, className: "bg-emerald-50 text-emerald-700" },
    { label: "failed", count: failed, className: "bg-red-50 text-red-700" },
    { label: "skipped", count: skipped, className: "bg-slate-100 text-slate-600" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Run counts">
      {chips
        .filter((chip) => chip.count > 0)
        .map((chip) => (
          <span
            key={chip.label}
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${chip.className}`}
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
      <div className="flex justify-center py-16 text-emerald-600">
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Workflows
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Automations that run when a ticket is created — conditions in,
            actions out.
          </p>
        </div>
        <Link to="/admin/workflows/new" className={`shrink-0 ${primaryButtonClass}`}>
          New workflow
        </Link>
      </div>

      {workflows.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-900">No workflows yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
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
        <ul className="mt-6 flex flex-col gap-3">
          {workflows.map((workflow) => (
            <li key={workflow.id}>
              <Link
                to={`/admin/workflows/${workflow.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {workflow.name}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          workflow.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {workflow.is_active ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      When a ticket is created
                      {workflow.conditions.length > 0 &&
                        ` · if ${workflow.conditions.map(conditionSummary).join(" and ")}`}
                      {" → "}
                      {workflow.actions.map(actionSummary).join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <RunCounts workflow={workflow} />
                    <span className="text-xs text-slate-400">
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
