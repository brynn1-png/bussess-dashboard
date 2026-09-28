import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { Icon, secondaryButtonClass } from "../../components/ui";
import { useAuth } from "../../features/auth/auth-context";
import {
  ChartColumn,
  Inbox,
  LayoutDashboard,
  LogOut,
  Users,
  Workflow,
} from "lucide-react";

type TabSpec = { to: string; label: string; icon: typeof Inbox; end?: boolean };

/**
 * Station tabs. Active = an ink stamp: a human has marked their position on
 * the panel. Inactive = an unstamped plate.
 */
const TABS: TabSpec[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/tickets", label: "Tickets", icon: Inbox },
  { to: "/admin/workflows", label: "Workflows", icon: Workflow },
  { to: "/admin/analytics", label: "Analytics", icon: ChartColumn },
  { to: "/admin/customers", label: "Customers", icon: Users },
];

function tabClass({ isActive }: { isActive: boolean }): string {
  return [
    "inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[13px] font-semibold transition-colors",
    isActive
      ? "border-ink bg-ink text-white"
      : "border-panel-300 bg-white text-panel-600 hover:bg-panel-100 hover:text-panel-800",
  ].join(" ");
}

/** Shell for all /admin routes: engraved header strip, station tabs, identity. */
export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-ground">
      <header className="groove-b bg-ground">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
            <Link to="/admin" className="min-w-0">
              <span className="block truncate text-[15px] font-extrabold tracking-tight text-ink">
                AI Business Automation Platform
              </span>
              <span className="legend mt-0.5 block">Admin console</span>
            </Link>

            <nav
              className="order-last flex w-full flex-wrap gap-1.5 sm:order-none sm:w-auto sm:flex-1 sm:justify-center"
              aria-label="Admin sections"
            >
              {TABS.map(({ to, label, icon, end }) => (
                <NavLink key={to} to={to} end={end} className={tabClass}>
                  <Icon icon={icon} className="h-3.5 w-3.5" />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Stacked, not inline: keeps all five station tabs on one row. */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <span className="hidden max-w-[9rem] truncate text-sm leading-tight text-panel-600 sm:block">
                {user?.full_name}
              </span>
              <button
                onClick={handleLogout}
                className={`${secondaryButtonClass} py-2`}
              >
                <Icon icon={LogOut} className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
