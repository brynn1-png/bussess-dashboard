import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="legend">Dead end</p>
      <h1 className="display text-[32px] text-ink">404 — Page not found</h1>
      <p className="max-w-sm text-sm text-panel-600">
        That route does not exist. The line stops here.
      </p>
      <Link
        to="/"
        className="mt-2 text-sm font-semibold text-route-700 underline underline-offset-4 hover:text-route-800"
      >
        Back to home
      </Link>
    </div>
  );
}
