import { Link, Outlet, useNavigate } from "react-router-dom";

import { secondaryButtonClass } from "../../components/ui";
import { useAuth } from "../../features/auth/auth-context";

/** Shell for all /portal routes: top bar with identity + sign out. */
export function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3.5">
          <Link to="/portal" className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight text-slate-900">
              AI Business Automation Platform
            </span>
            <span className="block text-xs text-slate-500">Customer portal</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden truncate text-sm text-slate-600 sm:block">
              {user?.full_name}
            </span>
            <button onClick={handleLogout} className={secondaryButtonClass}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
