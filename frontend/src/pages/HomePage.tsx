import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Icon,
  Spinner,
  primaryButtonClass,
  secondaryButtonClass,
} from "../components/ui";
import { Check } from "lucide-react";
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
      <p className="legend">Support desk · AI triage · Workflows</p>
      <h1 className="display text-[34px] sm:text-[46px]">
        AI Business Automation Platform
      </h1>
      <p className="max-w-lg text-panel-600">
        Support tickets, AI-assisted replies, and business workflows — one
        dashboard for your team and your customers.
      </p>

      <div
        className={`inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-xs ${
          status === "ready"
            ? "border-route-200 bg-route-50 text-route-700"
            : status === "error"
              ? "border-fault-200 bg-fault-50 text-fault-700"
              : "border-panel-200 bg-white text-panel-600"
        }`}
        role="status"
      >
        {status === "loading" && (
          <>
            <Spinner className="h-3.5 w-3.5" />
            Checking backend…
          </>
        )}
        {status === "ready" && (
          <>
            <Icon icon={Check} className="h-3.5 w-3.5" />
            Backend: connected
          </>
        )}
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
