import { useEffect, useState } from "react";

import { LoadError, Spinner } from "../../components/ui";
import { formatDateTime } from "../../lib/format";
import {
  listAdminCustomers,
  type AdminCustomer,
} from "../../services/api";

type Load = "loading" | "ready" | "error";

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [state, setState] = useState<Load>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listAdminCustomers()
      .then((data) => {
        if (cancelled) return;
        setCustomers(data);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (state === "loading") {
    return (
      <div className="flex justify-center py-16 text-signal-700">
        <Spinner />
      </div>
    );
  }

  if (state === "error") {
    return (
      <LoadError
        message="Could not load customers."
        onRetry={() => {
          setState("loading");
          setAttempt((n) => n + 1);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="display text-[32px] text-ink sm:text-[40px] lg:text-[48px]">
          Customers
        </h1>
        <span className="mach text-xs text-panel-500">
          {customers.length} total
        </span>
      </div>

      {customers.length === 0 ? (
        <div className="mt-8 border border-dashed border-panel-300 bg-white px-6 py-12 text-center">
          <p className="legend">No customers yet</p>
          <p className="mt-2 text-sm text-panel-600">
            Accounts appear here as soon as people register.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto border border-panel-200 bg-white shadow-sm">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="groove-b border-b border-panel-200 bg-panel-50">
              <tr>
                <th scope="col" className="legend px-4 py-3">Customer</th>
                <th scope="col" className="legend px-4 py-3">Tickets</th>
                <th scope="col" className="legend px-4 py-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-100">
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="transition-colors hover:bg-panel-50"
                >
                  <td className="px-4 py-3">
                    <span className="block font-medium text-ink">
                      {customer.full_name}
                    </span>
                    <span className="mach block break-all text-[11px] text-panel-500">
                      {customer.email}
                    </span>
                  </td>
                  <td className="mach px-4 py-3 text-panel-700">
                    {customer.ticket_count}
                  </td>
                  <td className="mach px-4 py-3 text-right text-[11px] text-panel-500">
                    {formatDateTime(customer.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
