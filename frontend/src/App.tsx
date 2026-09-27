import { Route, Routes } from "react-router-dom";

import { AuthProvider } from "./features/auth/AuthProvider";
import { Protected } from "./features/auth/Protected";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage";
import { PortalLayout } from "./pages/portal/PortalLayout";
import { NewTicketPage } from "./pages/portal/NewTicketPage";
import { TicketDetailPage } from "./pages/portal/TicketDetailPage";
import { TicketListPage } from "./pages/portal/TicketListPage";

export default function App() {
  return (
    <AuthProvider>
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/portal"
            element={
              <Protected>
                <PortalLayout />
              </Protected>
            }
          >
            <Route index element={<TicketListPage />} />
            <Route path="new" element={<NewTicketPage />} />
            <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </AuthProvider>
  );
}
