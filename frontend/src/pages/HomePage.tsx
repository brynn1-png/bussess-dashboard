import { useEffect, useState } from "react";

import { getHealth } from "../services/api";

type Status = "loading" | "ready" | "error";

export function HomePage() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    getHealth()
      .then(() => setStatus("ready"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">AI Business Automation Platform</h1>
      <p className="text-slate-600">Scaffold milestone (M0) — foundation in place.</p>
      <div
        className={`rounded-full px-4 py-1.5 text-sm font-medium ${
          status === "ready"
            ? "bg-emerald-100 text-emerald-800"
            : status === "error"
              ? "bg-red-100 text-red-800"
              : "bg-slate-200 text-slate-600"
        }`}
        role="status"
      >
        {status === "loading" && "Checking backend…"}
        {status === "ready" && "Backend: connected ✓"}
        {status === "error" && "Backend: unreachable"}
      </div>
    </div>
  );
}
