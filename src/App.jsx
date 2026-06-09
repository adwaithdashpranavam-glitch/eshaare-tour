import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

// Contexts
import { AuthProvider, ProtectedRoute, ClientRoute } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";
import PortalLayout from "./layouts/PortalLayout";

// Public Pages
import HomePage from "./pages/public/HomePage";
import VisaServicesPage from "./pages/public/VisaServicesPage";
import VisaDetailPage from "./pages/public/VisaDetailPage";
import PackagesPage from "./pages/public/PackagesPage";
import PackageDetailPage from "./pages/public/PackageDetailPage";
import DestinationsPage from "./pages/public/DestinationsPage";
import AboutPage from "./pages/public/AboutPage";
import ContactPage from "./pages/public/ContactPage";
import TrackApplicationPage from "./pages/public/TrackApplicationPage";
import ResourcesPage from "./pages/public/ResourcesPage";
import AppointmentBookingPage from "./pages/public/AppointmentBookingPage";
import GlobePage from "./pages/public/GlobePage";
import ScrollToTop from "./components/ui/ScrollToTop";

// Auth Pages
import AdminLogin from "./pages/auth/AdminLogin";
import PortalLogin from "./pages/auth/PortalLogin";

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import LeadsListPage from "./pages/admin/LeadsListPage";
import LeadDetailPage from "./pages/admin/LeadDetailPage";
import VisaCasesListPage from "./pages/admin/VisaCasesListPage";
import CaseDetailPage from "./pages/admin/CaseDetailPage";
import AppointmentsPage from "./pages/admin/AppointmentsPage";
import QuotationsListPage from "./pages/admin/QuotationsListPage";
import QuotationBuilderPage from "./pages/admin/QuotationBuilderPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import StaffManagementPage from "./pages/admin/StaffManagementPage";
import ReportsPage from "./pages/admin/ReportsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import VisaTypesListPage from "./pages/admin/VisaTypesListPage";
import VisaTypeEditorPage from "./pages/admin/VisaTypeEditorPage";

// Portal Pages
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalApplicationsPage from "./pages/portal/PortalApplicationsPage";
import PortalApplicationDetailPage from "./pages/portal/PortalApplicationDetailPage";
import PortalDocumentsPage from "./pages/portal/PortalDocumentsPage";
import PortalAppointmentsPage from "./pages/portal/PortalAppointmentsPage";
import PortalPaymentsPage from "./pages/portal/PortalPaymentsPage";
import PortalMessagesPage from "./pages/portal/PortalMessagesPage";
import PortalSettingsPage from "./pages/portal/PortalSettingsPage";
import PortalNotificationsPage from "./pages/portal/PortalNotificationsPage";

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              
              {/* PUBLIC MARKETING WEBSITE */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="visa-services" element={<VisaServicesPage />} />
                <Route path="visa/:slug" element={<VisaDetailPage />} />
                <Route path="visa-services/:slug" element={<VisaDetailPage />} />
                <Route path="packages" element={<PackagesPage />} />
                <Route path="packages/:slug" element={<PackageDetailPage />} />
                <Route path="destinations" element={<DestinationsPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="track" element={<TrackApplicationPage />} />
                <Route path="resources" element={<ResourcesPage />} />
                <Route path="appointment" element={<AppointmentBookingPage />} />
                <Route path="globe" element={<GlobePage />} />

                {/* CLIENT TRAVELLER PORTAL */}
                <Route 
                  path="portal" 
                  element={
                    <ClientRoute>
                      <PortalLayout />
                    </ClientRoute>
                  }
                >
                  <Route index element={<Navigate to="/portal/dashboard" replace />} />
                  <Route path="dashboard" element={<PortalDashboard />} />
                  <Route path="applications" element={<PortalApplicationsPage />} />
                  <Route path="applications/:id" element={<PortalApplicationDetailPage />} />
                  <Route path="documents" element={<PortalDocumentsPage />} />
                  <Route path="appointments" element={<PortalAppointmentsPage />} />
                  <Route path="payments" element={<PortalPaymentsPage />} />
                  <Route path="messages" element={<PortalMessagesPage />} />
                  <Route path="settings" element={<PortalSettingsPage />} />
                  <Route path="notifications" element={<PortalNotificationsPage />} />
                </Route>
              </Route>

              {/* AUTH ROUTES */}
              <Route path="/login" element={<AdminLogin />} />
              <Route path="/portal/login" element={<PortalLogin />} />

              {/* ADMIN CRM PORTAL (STAFF) */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="leads" element={<LeadsListPage />} />
                <Route path="leads/:id" element={<LeadDetailPage />} />
                <Route path="cases" element={<VisaCasesListPage />} />
                <Route path="cases/:id" element={<CaseDetailPage />} />
                <Route path="appointments" element={<AppointmentsPage />} />
                <Route path="quotations" element={<QuotationsListPage />} />
                <Route path="quotations/new" element={<QuotationBuilderPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="staff" element={<StaffManagementPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="visa-types" element={<VisaTypesListPage />} />
                <Route path="visa-types/new" element={<VisaTypeEditorPage />} />
                <Route path="visa-types/:id/edit" element={<VisaTypeEditorPage />} />
              </Route>

              {/* CATCH-ALL REDIRECT */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </BrowserRouter>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: "#2B2723",
                color: "#F5F1E8",
                border: "1px solid rgba(201,168,76,0.15)"
              }
            }}
          />
        </AuthProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
