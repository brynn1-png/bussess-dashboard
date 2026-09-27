import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import {
  ErrorAlert,
  Field,
  Spinner,
  inputClass,
  primaryButtonClass,
} from "../components/ui";
import { useAuth } from "../features/auth/auth-context";
import { ApiError } from "../services/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") return <Navigate to="/portal" replace />;

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Enter your password.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setRequestError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/portal", { replace: true });
    } catch (err) {
      setRequestError(
        err instanceof ApiError && err.status === 401
          ? "Invalid email or password."
          : "Could not sign you in right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign in
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Access your support tickets and updates.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-5">
            <ErrorAlert message={requestError} />

            <Field label="Email" htmlFor="login-email" error={fieldErrors.email}>
              <input
                id="login-email"
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
              htmlFor="login-password"
              error={fieldErrors.password}
            >
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </Field>

            <button type="submit" className={primaryButtonClass} disabled={submitting}>
              {submitting && <Spinner className="h-4 w-4" />}
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          New here?{" "}
          <Link
            to="/register"
            className="font-medium text-emerald-700 underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
