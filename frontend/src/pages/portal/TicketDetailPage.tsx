import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ErrorAlert,
  Field,
  LoadError,
  PriorityBadge,
  Spinner,
  StatusBadge,
  inputClass,
  primaryButtonClass,
} from "../../components/ui";
import { formatDateTime, timeAgo } from "../../lib/format";
import {
  ApiError,
  addTicketMessage,
  getTicket,
  type TicketDetail,
  type TicketMessage,
} from "../../services/api";

type Load = "loading" | "ready" | "notfound" | "error";

const SENDER_LABELS: Record<TicketMessage["sender"], string> = {
  customer: "You",
  admin: "Support",
  system: "System",
};

export function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const numericId = Number(ticketId);
  const validId = Number.isInteger(numericId) && numericId > 0;

  const [state, setState] = useState<Load>(() => (validId ? "loading" : "notfound"));
  const [ticket, setTicket] = useState<TicketDetail | null>(null);

  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    getTicket(numericId)
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

  async function reloadTicket() {
    setState("loading");
    try {
      const data = await getTicket(numericId);
      setTicket(data);
      setState("ready");
    } catch (err) {
      setState(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
    }
  }

  async function handleReply(event: FormEvent) {
    event.preventDefault();
    setReplyError(null);
    const content = reply.trim();
    if (!content) {
      setReplyError("Write a message before sending.");
      return;
    }
    setSending(true);
    try {
      const message = await addTicketMessage(numericId, content);
      setTicket((prev) =>
        prev ? { ...prev, messages: [...prev.messages, message] } : prev,
      );
      setReply("");
    } catch {
      setReplyError("Could not send your message. Please try again.");
    } finally {
      setSending(false);
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
        <p className="text-sm font-medium text-slate-900">Ticket not found</p>
        <p className="mt-1 text-sm text-slate-600">
          It may have been closed, or it does not belong to your account.
        </p>
        <Link
          to="/portal"
          className={`mt-5 ${primaryButtonClass}`}
        >
          Back to your tickets
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
          to="/portal"
          className="text-sm font-medium text-red-800 underline underline-offset-2"
        >
          ← Back to your tickets
        </Link>
      </LoadError>
    );
  }

  return (
    <div>
      <Link
        to="/portal"
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← All tickets
      </Link>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            {ticket.subject}
          </h1>
          <span className="shrink-0 text-xs text-slate-500 tabular-nums">
            #{ticket.id}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          {ticket.priority && <PriorityBadge priority={ticket.priority} />}
          <span className="text-xs text-slate-500">
            Opened {formatDateTime(ticket.created_at)}
          </span>
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">Conversation</h2>
      <ol className="mt-3 flex flex-col gap-3">
        {ticket.messages.map((message) => (
          <li
            key={message.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-900">
                {SENDER_LABELS[message.sender] ?? message.sender}
              </span>
              <span
                className="text-xs text-slate-500 tabular-nums"
                title={formatDateTime(message.created_at)}
              >
                {timeAgo(message.created_at)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {message.content}
            </p>
          </li>
        ))}
      </ol>

      {ticket.status !== "closed" && ticket.status !== "resolved" && (
        <form
          onSubmit={handleReply}
          noValidate
          className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-slate-900">Add a message</h2>
          <div className="mt-4 flex flex-col gap-4">
            <ErrorAlert message={replyError} />
            <Field
              label="Your reply"
              htmlFor="ticket-reply"
              hint="Sending keeps this ticket open for follow-ups."
            >
              <textarea
                id="ticket-reply"
                rows={4}
                className={`${inputClass} resize-y`}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Any additional details…"
                maxLength={10000}
              />
            </Field>
            <div>
              <button
                type="submit"
                className={primaryButtonClass}
                disabled={sending}
              >
                {sending && <Spinner className="h-4 w-4" />}
                {sending ? "Sending…" : "Send message"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
