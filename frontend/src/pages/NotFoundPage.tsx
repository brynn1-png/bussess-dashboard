import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">404 — Page not found</h1>
      <Link to="/" className="text-blue-600 underline hover:text-blue-800">
        Back to home
      </Link>
    </div>
  );
}
