import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ErrorAlert,
  Field,
  LoadError,
  Spinner,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../components/ui";
import { timeAgo } from "../../lib/format";
import {
  ApiError,
  createWorkflow,
  deleteWorkflow,
  getWorkflow,
  listWorkflowRuns,
  updateWorkflow,
  type Workflow,
  type WorkflowActionType,
  type WorkflowCondition,
  type WorkflowConditionField,
  type WorkflowRun,
  type WorkflowRunStatus,
} from "../../services/api";

type Load = "loading" | "ready" | "notfound" | "error";

const dangerButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60";

const CONDITION_FIELDS: { value: WorkflowConditionField; label: string }[] = [
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "category", label: "Category" },
  { value: "sentiment", label: "Sentiment" },
];

const CONDITION_OPTIONS: Partial<Record<WorkflowConditionField, string[]>> = {
  status: ["open", "in_progress", "resolved", "closed"],
  priority: ["low", "medium", "high", "urgent"],
  sentiment: ["positive", "neutral", "negative"],
};

const ACTION_TYPES: { value: WorkflowActionType; label: string }[] = [
  { value: "set_priority", label: "Set priority" },
  { value: "add_tag", label: "Add tag" },
  { value: "generate_suggested_response", label: "Generate suggested response" },
  { value: "record_notification", label: "Record notification" },
];

const ACTION_LABELS: Record<WorkflowActionType, string> = {
  set_priority: "Set priority",
  add_tag: "Add tag",
  generate_suggested_response: "Generate suggested response",
  record_notification: "Record notification",
};

const RUN_STYLES: Record<WorkflowRunStatus, string> = {
  success: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  skipped: "bg-slate-100 text-slate-600",
};

const MAX_CONDITIONS = 5;
const MAX_ACTIONS = 5;

function runSummary(run: WorkflowRun): string {
  const details = run.details as Record<string, unknown> | null;
  if (run.status === "failed") {
    return typeof details?.error === "string" ? details.error : "Unknown error";
  }
  if (run.status === "skipped") {
    const mismatched = details?.mismatched as
      | { field?: string; expected?: unknown; actual?: unknown }
      | undefined;
    if (mismatched) {
      return `Conditions not met — ${mismatched.field} expected “${String(mismatched.expected)}”, was “${String(mismatched.actual)}”`;
    }
    return "Conditions not met";
  }
  const executed = Array.isArray(details?.actions)
    ? (details.actions as { type: WorkflowActionType; note?: string }[])
    : [];
  return (
    executed
      .map((action) =>
        action.note
          ? `${ACTION_LABELS[action.type]} (${action.note})`
          : ACTION_LABELS[action.type],
      )
      .join(" · ") || "No actions"
  );
}

export function AdminWorkflowFormPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const isNew = workflowId === undefined;
  const numericId = Number(workflowId);
  const validId = isNew || (Number.isInteger(numericId) && numericId > 0);

  const [state, setState] = useState<Load>(() =>
    validId ? (isNew ? "ready" : "loading") : "notfound",
  );
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [conditions, setConditions] = useState<WorkflowCondition[]>([]);
  const [actions, setActions] = useState<{ type: WorkflowActionType; value: string }[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Load existing workflow + run history (edit mode only).
  useEffect(() => {
    if (isNew || !validId) return;
    let cancelled = false;
    Promise.all([getWorkflow(numericId), listWorkflowRuns(numericId)])
      .then(([loaded, runHistory]) => {
        if (cancelled) return;
        setWorkflow(loaded);
        setRuns(runHistory);
        setName(loaded.name);
        setIsActive(loaded.is_active);
        setConditions(loaded.conditions);
        setActions(loaded.actions.map((a) => ({ type: a.type, value: a.value })));
        setState("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [isNew, numericId, validId, attempt]);

  // Clear the "Saved" flash after a short delay.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [saved]);

  function updateCondition(index: number, patch: Partial<WorkflowCondition>) {
    setConditions((prev) =>
      prev.map((condition, i) => (i === index ? { ...condition, ...patch } : condition)),
    );
  }

  function updateAction(index: number, patch: Partial<{ type: WorkflowActionType; value: string }>) {
    setActions((prev) => prev.map((action, i) => (i === index ? { ...action, ...patch } : action)));
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setError("Give the workflow a name.");
      return;
    }
    if (actions.length === 0) {
      setError("Add at least one action.");
      return;
    }
    // Name the exact row — "Every condition needs a value" makes the admin hunt.
    const emptyCondition = conditions.findIndex(
      (condition) => condition.value.trim().length === 0,
    );
    if (emptyCondition !== -1) {
      setError(
        `Condition ${emptyCondition + 1} needs a value — pick one before saving.`,
      );
      return;
    }
    const emptyAction = actions.findIndex(
      (action) => action.value.trim().length === 0,
    );
    if (emptyAction !== -1) {
      setError(
        `Action ${emptyAction + 1} (${ACTION_LABELS[actions[emptyAction].type]}) needs a value.`,
      );
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        await createWorkflow({
          name: trimmedName,
          is_active: isActive,
          conditions,
          actions,
        });
        navigate("/admin/workflows");
      } else {
        const updated = await updateWorkflow(numericId, {
          name: trimmedName,
          is_active: isActive,
          conditions,
          actions,
        });
        setWorkflow(updated);
        setSaved(true);
        setConfirmDelete(false);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not save the workflow. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deleteWorkflow(numericId);
      navigate("/admin/workflows");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not delete the workflow.",
      );
      setDeleting(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="flex justify-center py-16 text-emerald-600">
        <Spinner />
      </div>
    );
  }

  if (state === "notfound") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-slate-900">Workflow not found</p>
        <p className="mt-1 text-sm text-slate-600">
          It may have been deleted, or the id is wrong.
        </p>
        <Link to="/admin/workflows" className={`mt-5 ${primaryButtonClass}`}>
          Back to workflows
        </Link>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div>
        <LoadError
          message="Could not load this workflow."
          onRetry={() => {
            setState("loading");
            setAttempt((n) => n + 1);
          }}
        />
        <Link
          to="/admin/workflows"
          className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
        >
          ← Back to workflows
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/admin/workflows"
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← All workflows
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {isNew ? "New workflow" : workflow?.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isNew
              ? "Runs automatically on every ticket created from now on."
              : `Created ${timeAgo(workflow?.created_at ?? "")} · trigger: ${workflow?.trigger}`}
          </p>
        </div>
        {!isNew && workflow && (
          <span
            className={`mt-1 inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              workflow.is_active
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {workflow.is_active ? "Active" : "Paused"}
          </span>
        )}
      </div>

      <form onSubmit={handleSave} noValidate className="mt-6 flex flex-col gap-6">
        <ErrorAlert message={error} />
        {saved && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Workflow saved.
          </p>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Basics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="workflow-name">
              <input
                id="workflow-name"
                type="text"
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                placeholder="e.g. Escalate urgent billing issues"
              />
            </Field>
            <Field
              label="Status"
              htmlFor="workflow-active"
              hint="Paused workflows stay configured but never run."
            >
              <select
                id="workflow-active"
                className={inputClass}
                value={isActive ? "active" : "paused"}
                onChange={(e) => setIsActive(e.target.value === "active")}
              >
                <option value="active">Active — runs on new tickets</option>
                <option value="paused">Paused — does not run</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">When</h2>
              <p className="mt-1 text-xs text-slate-500">
                Trigger: a ticket is created (the only trigger in this version).
                All conditions must match — no conditions means “every
                ticket”.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setConditions((prev) =>
                  prev.length >= MAX_CONDITIONS
                    ? prev
                    : [...prev, { field: "status", value: "open" }],
                )
              }
              disabled={conditions.length >= MAX_CONDITIONS}
              className={secondaryButtonClass}
            >
              Add condition
            </button>
          </div>

          {conditions.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              No conditions — this workflow runs on every new ticket.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {conditions.map((condition, index) => {
                const options = CONDITION_OPTIONS[condition.field];
                return (
                  <li key={index} className="flex flex-wrap items-end gap-2">
                    <span className="pb-2.5 text-xs font-medium text-slate-500">
                      {index === 0 ? "If" : "and"}
                    </span>
                    <div className="w-36">
                      <select
                        aria-label={`Condition ${index + 1} field`}
                        className={inputClass}
                        value={condition.field}
                        onChange={(e) => {
                          const field = e.target.value as WorkflowConditionField;
                          updateCondition(index, {
                            field,
                            value: CONDITION_OPTIONS[field]?.[0] ?? "",
                          });
                        }}
                      >
                        {CONDITION_FIELDS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {options ? (
                      <div className="w-44">
                        <select
                          aria-label={`Condition ${index + 1} value`}
                          className={inputClass}
                          value={condition.value}
                          onChange={(e) => updateCondition(index, { value: e.target.value })}
                        >
                          {options.map((value) => (
                            <option key={value} value={value}>
                              {value.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="min-w-40 flex-1">
                        <input
                          type="text"
                          aria-label={`Condition ${index + 1} value`}
                          className={inputClass}
                          value={condition.value}
                          onChange={(e) => updateCondition(index, { value: e.target.value })}
                          maxLength={50}
                          placeholder="e.g. billing"
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setConditions((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="pb-2.5 text-sm font-medium text-slate-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Then</h2>
              <p className="mt-1 text-xs text-slate-500">
                Actions run in order. Templates may use {"{customer}"} and{" "}
                {"{subject}"}. If an action fails, the whole run is marked
                failed and its changes are rolled back.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setActions((prev) =>
                  prev.length >= MAX_ACTIONS
                    ? prev
                    : [...prev, { type: "set_priority", value: "high" }],
                )
              }
              disabled={actions.length >= MAX_ACTIONS}
              className={secondaryButtonClass}
            >
              Add action
            </button>
          </div>

          {actions.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              No actions yet — add at least one.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {actions.map((action, index) => (
                <li key={index} className="flex flex-wrap items-end gap-2">
                  <span className="pb-2.5 text-xs font-medium text-slate-500">
                    {index + 1}.
                  </span>
                  <div className="w-56">
                    <select
                      aria-label={`Action ${index + 1} type`}
                      className={inputClass}
                      value={action.type}
                      onChange={(e) => {
                        const type = e.target.value as WorkflowActionType;
                        const defaults: Record<WorkflowActionType, string> = {
                          set_priority: "high",
                          add_tag: "",
                          generate_suggested_response: "",
                          record_notification: "",
                        };
                        updateAction(index, { type, value: defaults[type] });
                      }}
                    >
                      {ACTION_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {action.type === "set_priority" && (
                    <div className="w-40">
                      <select
                        aria-label={`Action ${index + 1} priority`}
                        className={inputClass}
                        value={action.value || "high"}
                        onChange={(e) => updateAction(index, { value: e.target.value })}
                      >                        {["low", "medium", "high", "urgent"].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {action.type === "add_tag" && (
                    <div className="min-w-40 flex-1">
                      <input
                        type="text"
                        aria-label={`Action ${index + 1} tag`}
                        className={inputClass}
                        value={action.value}
                        onChange={(e) => updateAction(index, { value: e.target.value })}
                        maxLength={30}
                        placeholder="e.g. escalated"
                      />
                    </div>
                  )}

                  {action.type === "record_notification" && (
                    <div className="min-w-56 flex-1">
                      <input
                        type="text"
                        aria-label={`Action ${index + 1} notification`}
                        className={inputClass}
                        value={action.value}
                        onChange={(e) => updateAction(index, { value: e.target.value })}
                        maxLength={200}
                        placeholder="Heads-up: {subject} needs a human"
                      />
                    </div>
                  )}

                  {action.type === "generate_suggested_response" && (
                    <div className="min-w-64 flex-1">
                      <textarea
                        rows={2}
                        aria-label={`Action ${index + 1} suggested response`}
                        className={`${inputClass} resize-y`}
                        value={action.value}
                        onChange={(e) => updateAction(index, { value: e.target.value })}
                        maxLength={1000}
                        placeholder="Hi {customer}, thanks for reaching out about {subject}…"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setActions((prev) => prev.filter((_, i) => i !== index))}
                    className="pb-2.5 text-sm font-medium text-slate-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={primaryButtonClass} disabled={saving}>
            {saving && <Spinner className="h-4 w-4" />}
            {saving ? "Saving…" : isNew ? "Create workflow" : "Save changes"}
          </button>
          <Link to="/admin/workflows" className={secondaryButtonClass}>
            Cancel
          </Link>
        </div>
      </form>

      {!isNew && workflow && (
        <>
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-slate-900">Recent runs</h2>
            {runs.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-600">
                No runs yet — create a ticket to trigger this workflow.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2.5">
                {runs.map((run) => (
                  <li key={run.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${RUN_STYLES[run.status]}`}
                        >
                          {run.status}
                        </span>
                        <p className="min-w-0 truncate text-sm text-slate-700">
                          {runSummary(run)}
                        </p>
                      </div>
                      <span
                        className="shrink-0 text-xs text-slate-400 tabular-nums"
                        title={run.created_at}
                      >
                        {timeAgo(run.created_at)}
                      </span>
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
                        Details
                      </summary>
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                        {JSON.stringify(run.details, null, 2)}
                      </pre>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8 rounded-xl border border-red-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-red-700">Danger zone</h2>
            <p className="mt-1 text-xs text-slate-500">
              Deleting removes the workflow and its run history. Tickets it
              already touched are not changed.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {confirmDelete && !deleting && (
                <p
                  className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                  role="alert"
                >
                  This permanently removes <strong>{workflow.name}</strong> and
                  its {runs.length} recorded run{runs.length === 1 ? "" : "s"}.
                  Tickets it already changed keep their tags and priority.
                  <span className="mt-1 block font-semibold">
                    There is no undo — click Confirm delete to apply.
                  </span>
                </p>
              )}
              <button
                type="button"
                onClick={handleDelete}
                className={confirmDelete ? dangerButtonClass : secondaryButtonClass}
                disabled={deleting}
              >
                {deleting && <Spinner className="h-4 w-4" />}
                {deleting ? "Deleting…" : confirmDelete ? "Confirm delete" : "Delete workflow"}
              </button>
              {confirmDelete && !deleting && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className={secondaryButtonClass}
                >
                  Cancel
                </button>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
