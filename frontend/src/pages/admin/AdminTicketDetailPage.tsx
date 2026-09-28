import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ErrorAlert,
  Field,
  Icon,
  LoadError,
  MachineHead,
  PriorityBadge,
  SealBand,
  Spinner,
  StatusBadge,
  dangerButtonClass,
  HazardNotice,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  statusNoticeClass,
  successNoticeClass,
} from "../../components/ui";
import { ArrowDown, ArrowLeft } from "lucide-react";
import { formatDateTime, initialsOf, timeAgo } from "../../lib/format";
import {
  ApiError,
  addAdminTicketMessage,
  getAdminTicket,
  updateAdminAnalysis,
  updateAdminTicket,
  type AdminTicketDetail,
  type TicketPriority,
  type TicketStatus,
} from "../../services/api";

type Load = "loading" | "ready" | "notfound" | "error";

const SENDER_LABELS: Record<string, string> = {
  customer: "Customer",
  admin: "Admin",
  system: "System",
};

const STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

/**
 * Sentiment is the machine's opinion of a human's words — printed in Courier
 * so it can never be mistaken for something a person wrote. Adverse is the one
 * value allowed to carry a hue (fault); positive stays deliberately quiet, so
 * the machine never gets to sound enthusiastic.
 */
const SENTIMENT_STYLES = {
  positive: "border-panel-300 bg-white text-panel-700",
  neutral: "border-panel-200 bg-panel-100 text-panel-600",
  negative: "border-fault-200 bg-fault-50 text-fault-800",
} as const;

export function AdminTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const numericId = Number(ticketId);
  const validId = Number.isInteger(numericId) && numericId > 0;

  const [state, setState] = useState<Load>(() => (validId ? "loading" : "notfound"));
  const [ticket, setTicket] = useState<AdminTicketDetail | null>(null);

  // Management form state.
  const [statusForm, setStatusForm] = useState<TicketStatus>("open");
  const [priorityForm, setPriorityForm] = useState<TicketPriority | "">("");
  const [categoryValue, setCategoryValue] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [mgmtSaving, setMgmtSaving] = useState(false);
  const [mgmtError, setMgmtError] = useState<string | null>(null);
  // Neutral "nothing to do" note — deliberately NOT an error (critique P1):
  // a harmless click must not be punished with a red alert.
  const [mgmtNotice, setMgmtNotice] = useState<string | null>(null);
  const [mgmtSaved, setMgmtSaved] = useState(false);

  // Admin reply state — closes the AI triage → human → customer loop.
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySending, setReplySending] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  /** Copy the AI's suggested response into the reply box, ready to edit. */
  function useDraftAsReply() {
    const draft = analysisDraft.trim();
    if (!draft) {
      setReplyError("There's no suggested response to reuse yet.");
      return;
    }
    setReply(draft);
    setReplyError(null);
    setReplySent(false);
    replyRef.current?.focus();
    replyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // AI review state.
  const [analysisDraft, setAnalysisDraft] = useState("");
  const [analysisSaving, setAnalysisSaving] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const [analysisSaved, setAnalysisSaved] = useState(false);

  // Seed the forms once per loaded ticket (not on every background update,
  // so unsaved edits in one panel survive saving the other).
  const initializedFor = useRef<number | null>(null);
  useEffect(() => {
    if (!ticket || initializedFor.current === ticket.id) return;
    initializedFor.current = ticket.id;
    setStatusForm(ticket.status);
    setPriorityForm(ticket.priority ?? "");
    setCategoryValue(ticket.category ?? "");
    setAnalysisDraft(ticket.analysis?.suggested_response ?? "");
    setConfirmClose(false);
  }, [ticket]);

  // Clear each "Saved" flash after a short delay.
  useEffect(() => {
    if (!mgmtSaved) return;
    const timer = setTimeout(() => setMgmtSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [mgmtSaved]);

  useEffect(() => {
    if (!analysisSaved) return;
    const timer = setTimeout(() => setAnalysisSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [analysisSaved]);

  useEffect(() => {
    if (!replySent) return;
    const timer = setTimeout(() => setReplySent(false), 2500);
    return () => clearTimeout(timer);
  }, [replySent]);

  // Keep the previous view while a refetch is in flight (portal pattern:
  // no synchronous setState in effects — initial state covers first load).
  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    getAdminTicket(numericId)
      .then((data) => {
        if (cancelled) return;
        setTicket(data);
        setState("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [numericId, validId]);

  async function handleManageSave(event: FormEvent) {
    event.preventDefault();
    if (!ticket) return;
    setMgmtError(null);

    // Closing is the one destructive transition — first click arms confirmation.
    const closing = statusForm === "closed" && ticket.status !== "closed";
    if (closing && !confirmClose) {
      setConfirmClose(true);
      return;
    }

    const trimmedCategory = categoryValue.trim();
    if (trimmedCategory.length === 0 && (ticket.category ?? "") !== "") {
      setMgmtError("Category can't be blank — enter a value or keep the current one.");
      return;
    }

    const payload: {
      status?: TicketStatus;
      priority?: TicketPriority;
      category?: string;
    } = {};
    if (statusForm !== ticket.status) payload.status = statusForm;
    if (priorityForm !== "" && priorityForm !== (ticket.priority ?? "")) {
      payload.priority = priorityForm as TicketPriority;
    }
    if (trimmedCategory !== (ticket.category ?? "")) {
      payload.category = trimmedCategory;
    }
    if (Object.keys(payload).length === 0) {
      setMgmtError(null);
      setMgmtNotice("Nothing changed — there's nothing to save.");
      return;
    }

    setMgmtSaving(true);
    try {
      const updated = await updateAdminTicket(ticket.id, payload);
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              status: updated.status,
              category: updated.category,
              priority: updated.priority,
              updated_at: updated.updated_at,
            }
          : prev,
      );
      setConfirmClose(false);
      setMgmtNotice(null);
      setMgmtSaved(true);
    } catch (err) {
      setMgmtError(
        err instanceof ApiError
          ? err.message
          : "Could not save your changes. Please try again.",
      );
    } finally {
      setMgmtSaving(false);
    }
  }

  async function handleAnalysisSave(confirmHuman: boolean) {
    if (!ticket?.analysis) return;
    setAnalysisError(null);
    const analysis = ticket.analysis;
    const trimmed = analysisDraft.trim();

    const payload: { suggested_response?: string; is_human_confirmed?: boolean } = {};
    if (trimmed !== (analysis.suggested_response ?? "")) {
      if (trimmed.length === 0) {
        setAnalysisError("The suggested response can't be blank.");
        return;
      }
      payload.suggested_response = trimmed;
    }
    if (confirmHuman && !analysis.is_human_confirmed) {
      payload.is_human_confirmed = true;
    }
    if (Object.keys(payload).length === 0) {
      setAnalysisError(null);
      setAnalysisNotice("Nothing changed — there's nothing to save.");
      return;
    }

    setAnalysisSaving(true);
    try {
      const updated = await updateAdminAnalysis(ticket.id, payload);
      setTicket((prev) =>
        prev?.analysis ? { ...prev, analysis: { ...prev.analysis, ...updated } } : prev,
      );
      setAnalysisNotice(null);
      setAnalysisSaved(true);
    } catch (err) {
      setAnalysisError(
        err instanceof ApiError
          ? err.message
          : "Could not save the analysis. Please try again.",
      );
    } finally {
      setAnalysisSaving(false);
    }
  }

  async function handleReply(event: FormEvent) {
    event.preventDefault();
    if (!ticket) return;
    setReplyError(null);
    const content = reply.trim();
    if (!content) {
      setReplyError("Write a reply before sending it.");
      return;
    }
    setReplySending(true);
    try {
      const message = await addAdminTicketMessage(ticket.id, content);
      setTicket((prev) =>
        prev ? { ...prev, messages: [...prev.messages, message] } : prev,
      );
      setReply("");
      setReplySent(true);
    } catch (err) {
      setReplyError(
        err instanceof ApiError
          ? err.message
          : "Could not send your reply. Please try again.",
      );
    } finally {
      setReplySending(false);
    }
  }

  async function reloadTicket() {
    setState("loading");
    try {
      const data = await getAdminTicket(numericId);
      setTicket(data);
      setState("ready");
    } catch (err) {
      setState(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
    }
  }

  if (state === "loading") {
    return (
      <div className="flex justify-center py-16 text-signal-700">
        <Spinner />
      </div>
    );
  }

  if (state === "notfound") {
    return (
      <div className="border border-panel-200 bg-white px-6 py-12 text-center">
        <p className="legend">Ticket not found</p>
        <p className="mt-2 text-sm text-panel-600">
          It may have been deleted, or the id is wrong.
        </p>
        <Link to="/admin/tickets" className={`mt-5 ${primaryButtonClass}`}>
          Back to tickets
        </Link>
      </div>
    );
  }

  if (state === "error" || !ticket) {
    return (
      <LoadError
        message="Could not load this ticket."
        onRetry={reloadTicket}
      >
        <Link
          to="/admin/tickets"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fault-800 underline underline-offset-2"
        >
          <Icon icon={ArrowLeft} className="h-4 w-4" />
          Back to tickets
        </Link>
      </LoadError>
    );
  }

  const analysis = ticket.analysis;
  /** True when the suggested-response box no longer matches the saved record. */
  const analysisDirty =
    analysis !== null &&
    analysisDraft.trim() !== (analysis.suggested_response ?? "").trim();
  /** True when the manage form no longer matches the ticket record. */
  const mgmtDirty =
    statusForm !== ticket.status ||
    priorityForm !== (ticket.priority ?? "") ||
    categoryValue.trim() !== (ticket.category ?? "");

  return (
    <div>
      <Link
        to="/admin/tickets"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-panel-600 hover:text-ink"
      >
        <Icon icon={ArrowLeft} className="h-4 w-4" />
        All tickets
      </Link>

      <div className="mt-4 border border-panel-200 bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="display text-[24px] text-ink sm:text-[28px]">
            {ticket.subject}
          </h1>
          <span className="mach shrink-0 text-xs text-panel-500">
            #{ticket.id}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          {ticket.priority && <PriorityBadge priority={ticket.priority} />}
          {ticket.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center border border-panel-300 bg-white px-2 py-0.5 font-mono text-xs text-panel-700"
              title="Added by a workflow"
            >
              {tag}
            </span>
          ))}
          <span className="text-xs text-panel-500">
            {ticket.customer.full_name} · opened {formatDateTime(ticket.created_at)}
          </span>
        </div>
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-3 lg:gap-6">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section>
            <h2 className="legend">Conversation</h2>
            <ol className="mt-3 flex flex-col gap-3">
              {ticket.messages.map((message) => {
                const machine = message.sender === "system";
                return (
                  <li
                    key={message.id}
                    className={`bg-white p-4 ${
                      machine
                        ? "border border-dashed border-panel-400"
                        : "border border-panel-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`legend ${machine ? "text-panel-700" : "text-ink"}`}
                      >
                        {SENDER_LABELS[message.sender] ?? message.sender}
                      </span>
                      <span
                        className="mach text-[11px] text-panel-500"
                        title={formatDateTime(message.created_at)}
                      >
                        {timeAgo(message.created_at)}
                      </span>
                    </div>
                    <p
                      className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${
                        machine ? "text-panel-700" : "text-ink"
                      }`}
                    >
                      {message.content}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>

          <section
            aria-label="AI analysis"
            className={`bg-white ${
              analysis?.is_human_confirmed
                ? "border border-panel-300"
                : "border border-dashed border-panel-400"
            }`}
          >
            {analysis === null ? (
              <div className="groove-b bg-panel-50 px-4 py-2">
                <span className="legend text-panel-700">Machine · AI analysis</span>
              </div>
            ) : (
              <MachineHead
                source={`AI analysis · ${analysis.provider ?? "unknown"}`}
                sealed={analysis.is_human_confirmed}
                stamped={timeAgo(analysis.updated_at)}
              />
            )}

            {analysis?.is_human_confirmed && (
              <SealBand
                initials={initialsOf(analysis.confirmed_by)}
                by={analysis.confirmed_by ?? "a human reviewer"}
                at={formatDateTime(analysis.updated_at)}
              />
            )}

            <div className="flex flex-col gap-4 p-5">
              {analysis === null && (
                <div className="border border-dashed border-panel-300 bg-panel-50 px-4 py-5 text-center">
                  <p className="text-sm text-panel-600">
                    No analysis yet — it runs automatically right after a ticket
                    is created.
                  </p>
                  <button
                    type="button"
                    onClick={reloadTicket}
                    className={`mt-4 ${secondaryButtonClass}`}
                  >
                    Check again
                  </button>
                </div>
              )}

              {analysis !== null && analysis.status === "pending" && (
                <div className="border border-signal-200 bg-signal-50 px-4 py-3 text-sm text-signal-800">
                  Analysis is queued — check again in a moment.{" "}
                  <button
                    type="button"
                    onClick={reloadTicket}
                    className="font-semibold underline underline-offset-2"
                  >
                    Refresh
                  </button>
                </div>
              )}

              {analysis !== null && analysis.status === "failed" && (
                <div
                  className="border border-fault-200 bg-fault-50 px-4 py-3 text-sm text-fault-800"
                  role="alert"
                >
                  <span className="font-semibold">AI analysis failed.</span>{" "}
                  {analysis.error_message ?? "No further details."} You can still
                  write the suggested response below and confirm it manually.
                </div>
              )}

              {analysis !== null && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border border-panel-300 bg-white px-2 py-0.5 font-mono text-xs text-panel-700">
                      {analysis.category ?? "uncategorized"}
                    </span>
                    {analysis.priority && (
                      <PriorityBadge priority={analysis.priority} />
                    )}
                    {analysis.sentiment && (
                      <span
                        className={`inline-flex items-center border px-2 py-0.5 font-mono text-xs capitalize ${SENTIMENT_STYLES[analysis.sentiment]}`}
                      >
                        {analysis.sentiment}
                      </span>
                    )}
                  </div>

                {analysis.summary && (
                  /* The machine's own words print in Courier — the face is the
                     provenance mark (surface brief OWN-WORLD). */
                  <p className="mach text-[13px] leading-[1.75] text-panel-700">
                    {analysis.summary}
                  </p>
                )}

                <Field
                  label="Suggested response"
                  htmlFor="analysis-response"
                  hint="Edit freely — confirming marks the AI text as reviewed by a human."
                >
                  <textarea
                    id="analysis-response"
                    rows={5}
                    className={`${inputClass} mach resize-y`}
                    value={analysisDraft}
                    onChange={(e) => {
                      setAnalysisDraft(e.target.value);
                      setAnalysisNotice(null);
                    }}
                    maxLength={10000}
                    placeholder="No suggested response — write one for the customer."
                  />
                </Field>

                <ErrorAlert message={analysisError} />
                {analysisNotice && (
                  <p className={statusNoticeClass} role="status">
                    {analysisNotice}
                  </p>
                )}
                {analysisSaved && (
                  <p className={successNoticeClass} role="status">
                    Analysis saved.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {!analysis.is_human_confirmed ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAnalysisSave(true)}
                        className={primaryButtonClass}
                        disabled={analysisSaving}
                      >
                        {analysisSaving && <Spinner className="h-4 w-4" />}
                        {analysisSaving ? "Saving…" : "Save & confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAnalysisSave(false)}
                        className={secondaryButtonClass}
                        disabled={analysisSaving || !analysisDirty}
                      >
                        Save draft
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAnalysisSave(false)}
                      className={primaryButtonClass}
                      disabled={analysisSaving || !analysisDirty}
                    >
                      {analysisSaving && <Spinner className="h-4 w-4" />}
                      {analysisSaving
                        ? "Saving…"
                        : analysisDirty
                          ? "Save changes"
                          : "No changes"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={useDraftAsReply}
                    className="inline-flex items-center justify-center gap-2 border border-route-300 bg-route-50 px-4 py-2.5 text-sm font-semibold text-route-700 transition-colors hover:bg-route-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!analysisDraft.trim()}
                    title="Copy this text into the reply box below, ready to edit and send"
                  >
                    Use as reply
                    <Icon icon={ArrowDown} className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

          <form
            onSubmit={handleReply}
            noValidate
            className="border border-panel-200 bg-white"
          >
            <div className="groove-b flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 bg-route-50 px-4 py-2">
              <span className="legend text-route-700">
                Human · Reply to customer
              </span>
              <span className="mach text-[11px] text-panel-500">
                Sent as Support
              </span>
            </div>
            <div className="flex flex-col gap-4 p-5">
              <ErrorAlert message={replyError} />
              {replySent && (
                <p className={successNoticeClass} role="status">
                  Reply sent — the customer sees it on their ticket.
                </p>
              )}
              <Field
                label="Your reply"
                htmlFor="admin-reply"
                hint="The customer sees this on their ticket, and it stays in the thread above."
              >
                <textarea
                  ref={replyRef}
                  id="admin-reply"
                  rows={4}
                  className={`${inputClass} resize-y`}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write your reply…"
                  maxLength={10000}
                />
              </Field>
              <div>
                <button
                  type="submit"
                  className={primaryButtonClass}
                  disabled={replySending || !reply.trim()}
                >
                  {replySending && <Spinner className="h-4 w-4" />}
                  {replySending ? "Sending…" : "Send reply"}
                </button>
              </div>
            </div>
          </form>
        </div>

        <aside className="mt-6 flex flex-col gap-6 lg:mt-0">
          <form
            onSubmit={handleManageSave}
            noValidate
            className="border border-panel-200 bg-white"
          >
            <div className="groove-b bg-route-50 px-4 py-2">
              <span className="legend text-route-700">Human · Manage ticket</span>
            </div>
            <div className="flex flex-col gap-4 p-5">
              <ErrorAlert message={mgmtError} />
              {mgmtNotice && (
                <p className={statusNoticeClass} role="status">
                  {mgmtNotice}
                </p>
              )}
              {mgmtSaved && (
                <p className={successNoticeClass} role="status">
                  Changes saved.
                </p>
              )}

              <Field label="Status" htmlFor="manage-status">
                <select
                  id="manage-status"
                  className={inputClass}
                  value={statusForm}
                  onChange={(e) => {
                    setStatusForm(e.target.value as TicketStatus);
                    setConfirmClose(false);
                    setMgmtNotice(null);
                  }}
                >
                  {STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {STATUS_LABELS[value]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Priority" htmlFor="manage-priority">
                <select
                  id="manage-priority"
                  className={inputClass}
                  value={priorityForm}
                  onChange={(e) => {
                    setPriorityForm(e.target.value as TicketPriority | "");
                    setMgmtNotice(null);
                  }}
                >
                  {ticket.priority === null && (
                    <option value="" disabled>
                      Not set yet
                    </option>
                  )}
                  {PRIORITIES.map((value) => (
                    <option key={value} value={value}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Category"
                htmlFor="manage-category"
                hint="Free text, up to 50 characters."
              >
                <input
                  id="manage-category"
                  type="text"
                  className={inputClass}
                  value={categoryValue}
                  onChange={(e) => {
                    setCategoryValue(e.target.value);
                    setMgmtNotice(null);
                  }}
                  maxLength={50}
                  placeholder="e.g. billing"
                />
              </Field>

              {confirmClose && (
                <HazardNotice>
                  Closing ends the conversation for this ticket. Click{" "}
                  <span className="font-semibold">Confirm close</span> to apply.
                </HazardNotice>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className={confirmClose ? dangerButtonClass : primaryButtonClass}
                  disabled={mgmtSaving || (!confirmClose && !mgmtDirty)}
                >
                  {mgmtSaving && <Spinner className="h-4 w-4" />}
                  {mgmtSaving
                    ? "Saving…"
                    : confirmClose
                      ? "Confirm close"
                      : mgmtDirty
                        ? "Save changes"
                        : "No changes"}
                </button>
                {confirmClose && !mgmtSaving && (
                  <button
                    type="button"
                    onClick={() => setConfirmClose(false)}
                    className={secondaryButtonClass}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>

          <div className="border border-panel-200 bg-white p-5">
            <h2 className="legend">Customer</h2>
            <dl className="mt-3 flex flex-col gap-2.5 text-sm">
              <div>
                <dt className="mach text-[11px] text-panel-500">Name</dt>
                <dd className="font-semibold text-ink">
                  {ticket.customer.full_name}
                </dd>
              </div>
              <div>
                <dt className="mach text-[11px] text-panel-500">Email</dt>
                <dd className="break-all text-panel-700">
                  {ticket.customer.email}
                </dd>
              </div>
              <div>
                <dt className="mach text-[11px] text-panel-500">Last update</dt>
                <dd className="mach text-panel-700">
                  {formatDateTime(ticket.updated_at)}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
