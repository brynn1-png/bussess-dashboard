import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ErrorAlert,
  Field,
  Spinner,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../components/ui";
import { createTicket } from "../../services/api";

const MIN_MESSAGE = 10;

export function NewTicketPage() {
  const navigate = useNavigate();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ subject?: string; message?: string }>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    const trimmedSubject = subject.trim();
    if (trimmedSubject.length < 3)
      errors.subject = "Subject must be at least 3 characters.";
    if (message.trim().length < MIN_MESSAGE)
      errors.message = `Please describe the issue in at least ${MIN_MESSAGE} characters.`;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setRequestError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const ticket = await createTicket({
        subject: subject.trim(),
        message: message.trim(),
      });
      navigate(`/portal/tickets/${ticket.id}`, { replace: true });
    } catch {
      setRequestError("Could not submit your ticket right now. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold tracking-tight text-slate-900">
        Submit a ticket
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Tell us what is going on — we will reply right here in the portal.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-5">
          <ErrorAlert message={requestError} />

          <Field label="Subject" htmlFor="ticket-subject" error={fieldErrors.subject}>
            <input
              id="ticket-subject"
              type="text"
              className={inputClass}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Short summary of the problem"
              maxLength={200}
            />
          </Field>

          <Field
            label="Message"
            htmlFor="ticket-message"
            error={fieldErrors.message}
            hint={`At least ${MIN_MESSAGE} characters. Include steps to reproduce if you can.`}
          >
            <textarea
              id="ticket-message"
              rows={7}
              className={`${inputClass} resize-y`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What happened? What did you expect instead?"
              maxLength={10000}
            />
          </Field>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className={primaryButtonClass}
              disabled={submitting}
            >
              {submitting && <Spinner className="h-4 w-4" />}
              {submitting ? "Submitting…" : "Submit ticket"}
            </button>
            <Link to="/portal" className={secondaryButtonClass}>
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
