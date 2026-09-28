import type { ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";

import { Spinner, primaryButtonClass } from "../../components/ui";
import { homePath, useAuth } from "./auth-context";

/**
 * Route gate: loading → spinner, anonymous → /login.
 * With `role`, a signed-in user of the other role gets a friendly
 * "wrong area" screen instead of pages that would only return 403s.
 */
export function Protected({
  children,
  role,
}: {
  children: ReactNode;
  role?: "customer" | "admin";
}) {
  const { status, user } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ground">
        <Spinner className="h-6 w-6 text-signal-700" />
      </div>
    );
  }
  if (status === "anonymous") {
    return <Navigate to="/login" replace />;
  }
  if (role && user && user.role !== role) {
    const areaLabel =
      role === "admin" ? "administrator" : "customer";
    return (
      <div className="flex min-h-screen items-center justify-center bg-ground px-4">
        <div className="w-full max-w-md border border-panel-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-ink">
            This area is for {areaLabel} accounts
          </p>
          <p className="mt-1.5 text-sm text-panel-600">
            You are signed in as{" "}
            <span className="font-medium text-ink">{user.email}</span>.
          </p>
          <Link to={homePath(user.role)} className={`mt-5 ${primaryButtonClass}`}>
            Go to my dashboard
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
