import { Route, Routes } from "react-router-dom";

import { AuthProvider } from "./features/auth/AuthProvider";
import { Protected } from "./features/auth/Protected";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminAnalyticsPage } from "./pages/admin/AdminAnalyticsPage";
import { AdminCustomersPage } from "./pages/admin/AdminCustomersPage";
import { AdminOverviewPage } from "./pages/admin/AdminOverviewPage";
import { AdminTicketDetailPage } from "./pages/admin/AdminTicketDetailPage";
import { AdminTicketListPage } from "./pages/admin/AdminTicketListPage";
import { AdminWorkflowFormPage } from "./pages/admin/AdminWorkflowFormPage";
import { AdminWorkflowsPage } from "./pages/admin/AdminWorkflowsPage";
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
              <Protected role="customer">
                <PortalLayout />
              </Protected>
            }
          >
            <Route index element={<TicketListPage />} />
            <Route path="new" element={<NewTicketPage />} />
            <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
          </Route>
          <Route
            path="/admin"
            element={
              <Protected role="admin">
                <AdminLayout />
              </Protected>
            }
          >
            <Route index element={<AdminOverviewPage />} />
            <Route path="tickets" element={<AdminTicketListPage />} />
            <Route path="tickets/:ticketId" element={<AdminTicketDetailPage />} />
            <Route path="workflows" element={<AdminWorkflowsPage />} />
            <Route path="workflows/new" element={<AdminWorkflowFormPage />} />
            <Route path="workflows/:workflowId" element={<AdminWorkflowFormPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </AuthProvider>
  );
}
