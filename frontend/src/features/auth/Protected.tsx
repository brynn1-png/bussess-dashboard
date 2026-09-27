import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { Spinner } from "../../components/ui";
import { useAuth } from "./auth-context";

/** Gate for portal routes: loading → spinner, anonymous → /login. */
export function Protected({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner className="h-6 w-6 text-emerald-600" />
      </div>
    );
  }
  if (status === "anonymous") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
