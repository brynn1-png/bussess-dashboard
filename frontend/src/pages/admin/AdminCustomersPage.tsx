import { useEffect, useState } from "react";

import { Spinner } from "../../components/ui";
import { formatDateTime } from "../../lib/format";
import {
  listAdminCustomers,
  type AdminCustomer,
} from "../../services/api";

type Load = "loading" | "ready" | "error";

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [state, setState] = useState<Load>("loading");

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
  }, []);

  if (state === "loading") {
    return (
      <div className="flex justify-center py-16 text-emerald-600">
        <Spinner />
      </div>
    );
  }

  if (state === "error") {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Could not load customers. Refresh the page to try again.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Customers
        </h1>
        <span className="text-sm text-slate-500">
          {customers.length} total
        </span>
      </div>

      {customers.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-900">No customers yet</p>
          <p className="mt-1 text-sm text-slate-600">
            Accounts appear here as soon as people register.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Tickets</th>
                <th className="px-4 py-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <span className="block font-medium text-slate-900">
                      {customer.full_name}
                    </span>
                    <span className="block break-all text-xs text-slate-500">
                      {customer.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {customer.ticket_count}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500 tabular-nums">
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
