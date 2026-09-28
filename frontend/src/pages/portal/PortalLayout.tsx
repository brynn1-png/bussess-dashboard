import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { Icon, secondaryButtonClass } from "../../components/ui";
import { useAuth } from "../../features/auth/auth-context";
import { Inbox, LogOut, PenLine } from "lucide-react";

/** Shell for all /portal routes: engraved header strip, station tabs, identity. */
export function PortalLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-ground">
      <header className="groove-b bg-ground">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
            <Link to="/portal" className="min-w-0">
              <span className="block truncate text-[15px] font-extrabold tracking-tight text-ink">
                AI Business Automation Platform
              </span>
              <span className="legend mt-0.5 block">Customer portal</span>
            </Link>

            <nav
              className="order-last flex w-full flex-wrap gap-1.5 sm:order-none sm:w-auto sm:flex-1 sm:justify-center"
              aria-label="Portal sections"
            >
              <NavLink
                to="/portal"
                end
                className={({ isActive }) =>
                  [
                    "inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[13px] font-semibold transition-colors",
                    isActive
                      ? "border-ink bg-ink text-white"
                      : "border-panel-300 bg-white text-panel-600 hover:bg-panel-100 hover:text-panel-800",
                  ].join(" ")
                }
              >
                <Icon icon={Inbox} className="h-3.5 w-3.5" />
                My tickets
              </NavLink>
              <NavLink
                to="/portal/new"
                className={({ isActive }) =>
                  [
                    "inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-[13px] font-semibold transition-colors",
                    isActive
                      ? "border-ink bg-ink text-white"
                      : "border-panel-300 bg-white text-panel-600 hover:bg-panel-100 hover:text-panel-800",
                  ].join(" ")
                }
              >
                <Icon icon={PenLine} className="h-3.5 w-3.5" />
                New ticket
              </NavLink>
            </nav>

            {/* Stacked, not inline: keeps the tab row on one line in both shells. */}
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
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
