import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Spinner,
  primaryButtonClass,
  secondaryButtonClass,
} from "../components/ui";
import { useAuth } from "../features/auth/auth-context";
import { getHealth } from "../services/api";

type Status = "loading" | "ready" | "error";

export function HomePage() {
  const [status, setStatus] = useState<Status>("loading");
  const { status: authStatus } = useAuth();

  useEffect(() => {
    getHealth()
      .then(() => setStatus("ready"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">
        AI Business Automation Platform
      </h1>
      <p className="max-w-lg text-slate-600">
        Support tickets, AI-assisted replies, and business workflows — one
        dashboard for your team and your customers.
      </p>

      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${
          status === "ready"
            ? "bg-emerald-100 text-emerald-800"
            : status === "error"
              ? "bg-red-100 text-red-800"
              : "bg-slate-200 text-slate-600"
        }`}
        role="status"
      >
        {status === "loading" && (
          <>
            <Spinner className="h-3.5 w-3.5" />
            Checking backend…
          </>
        )}
        {status === "ready" && "Backend: connected ✓"}
        {status === "error" && "Backend: unreachable"}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {authStatus === "authenticated" ? (
          <Link to="/portal" className={primaryButtonClass}>
            Open your portal
          </Link>
        ) : (
          <>
            <Link to="/register" className={primaryButtonClass}>
              Create an account
            </Link>
            <Link to="/login" className={secondaryButtonClass}>
              Sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
