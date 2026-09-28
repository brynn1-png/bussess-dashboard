import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import {
  ErrorAlert,
  Field,
  Icon,
  LoadError,
  PriorityBadge,
  Spinner,
  StatusBadge,
  inputClass,
  primaryButtonClass,
} from "../../components/ui";
import { ArrowLeft } from "lucide-react";
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
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fault-800 underline underline-offset-2"
        >
          <Icon icon={ArrowLeft} className="h-4 w-4" />
          Back to your tickets
        </Link>
      </LoadError>
    );
  }

  return (
    <div>
      <Link
        to="/portal"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-panel-600 hover:text-ink"
      >
        <Icon icon={ArrowLeft} className="h-4 w-4" />
        All tickets
      </Link>

      <div className="mt-4 border border-panel-200 bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="display text-[22px] text-ink sm:text-[26px]">
            {ticket.subject}
          </h1>
          <span className="mach shrink-0 text-xs text-panel-500">
            #{ticket.id}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          {ticket.priority && <PriorityBadge priority={ticket.priority} />}
          <span className="mach text-[11px] text-panel-500">
            Opened {formatDateTime(ticket.created_at)}
          </span>
        </div>
      </div>

      <h2 className="legend mt-8">Conversation</h2>
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
                className={`mt-2 whitespace-pre-wrap leading-6 ${
                  machine ? "text-panel-700" : "text-ink"
                } text-sm`}
              >
                {message.content}
              </p>
            </li>
          );
        })}
      </ol>

      {ticket.status !== "closed" && ticket.status !== "resolved" && (
        <form
          onSubmit={handleReply}
          noValidate
          className="mt-6 border border-panel-200 bg-white"
        >
          <div className="groove-b bg-route-50 px-4 py-2">
            <span className="legend text-route-700">Human · Add a message</span>
          </div>
          <div className="flex flex-col gap-4 p-5">
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
                disabled={sending || !reply.trim()}
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
