import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import {
  ErrorAlert,
  Field,
  Spinner,
  inputClass,
  primaryButtonClass,
} from "../components/ui";
import { homePath, useAuth } from "../features/auth/auth-context";
import { ApiError } from "../services/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPage() {
  const { status, user, register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") return <Navigate to={homePath(user?.role)} replace />;

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    if (!fullName.trim()) errors.fullName = "Enter your name.";
    if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
    if (password.length < 8)
      errors.password = "Password must be at least 8 characters.";
    if (confirm !== password) errors.confirm = "Passwords do not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setRequestError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register(fullName.trim(), email.trim(), password);
      navigate("/portal", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setRequestError(
          "An account with this email already exists — try signing in instead.",
        );
      } else {
        setRequestError("Could not create your account right now. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ground px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="display text-center text-[28px] text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-center text-sm text-panel-600">
          Submit support tickets and track every reply in one place.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 border border-panel-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-5">
            <ErrorAlert message={requestError} />

            <Field
              label="Full name"
              htmlFor="reg-name"
              error={fieldErrors.fullName}
            >
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Rivera"
              />
            </Field>

            <Field label="Email" htmlFor="reg-email" error={fieldErrors.email}>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>

            <Field
              label="Password"
              htmlFor="reg-password"
              error={fieldErrors.password}
              hint="At least 8 characters."
            >
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password"
              />
            </Field>

            <Field
              label="Confirm password"
              htmlFor="reg-confirm"
              error={fieldErrors.confirm}
            >
              <input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
              />
            </Field>

            <button type="submit" className={primaryButtonClass} disabled={submitting}>
              {submitting && <Spinner className="h-4 w-4" />}
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-panel-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-route-700 underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
