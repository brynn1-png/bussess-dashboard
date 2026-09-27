import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { secondaryButtonClass } from "../../components/ui";
import { useAuth } from "../../features/auth/auth-context";

function tabClass({ isActive }: { isActive: boolean }): string {
  return [
    "border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
    isActive
      ? "border-emerald-600 text-emerald-700"
      : "border-transparent text-slate-600 hover:text-slate-900",
  ].join(" ");
}

/** Shell for all /admin routes: brand bar, section nav, identity + sign out. */
export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between gap-4 py-3.5">
            <Link to="/admin" className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-slate-900">
                AI Business Automation Platform
              </span>
              <span className="block text-xs text-slate-500">Admin console</span>
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
          <nav className="flex gap-6" aria-label="Admin sections">
            <NavLink to="/admin" end className={tabClass}>
              Overview
            </NavLink>
            <NavLink to="/admin/tickets" className={tabClass}>
              Tickets
            </NavLink>
            <NavLink to="/admin/workflows" className={tabClass}>
              Workflows
            </NavLink>
            <NavLink to="/admin/analytics" className={tabClass}>
              Analytics
            </NavLink>
            <NavLink to="/admin/customers" className={tabClass}>
              Customers
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
