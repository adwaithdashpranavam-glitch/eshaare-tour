import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";

// Contexts
import { AuthProvider, ProtectedRoute, ClientRoute, RequireVerifiedEmail } from "./contexts/AuthContext";
import { TravelerProfileProvider, ProfileCompleteGuard } from "./contexts/TravelerProfileContext";
import { AppProvider } from "./contexts/AppContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";
import PortalLayout from "./layouts/PortalLayout";

// Components
import ScrollToTop from "./components/ui/ScrollToTop";

// Public Pages
import HomePage from "./pages/public/HomePage";
const VisaServicesPage = lazy(() => import("./pages/public/VisaServicesPage"));
const VisaDetailPage = lazy(() => import("./pages/public/VisaDetailPage"));
const PackagesPage = lazy(() => import("./pages/public/PackagesPage"));
const PackageDetailPage = lazy(() => import("./pages/public/PackageDetailPage"));
const DestinationsPage = lazy(() => import("./pages/public/DestinationsPage"));
const AboutPage = lazy(() => import("./pages/public/AboutPage"));
const ContactPage = lazy(() => import("./pages/public/ContactPage"));
const TrackApplicationPage = lazy(() => import("./pages/public/TrackApplicationPage"));
const ResourcesPage = lazy(() => import("./pages/public/ResourcesPage"));
const AppointmentBookingPage = lazy(() => import("./pages/public/AppointmentBookingPage"));
const GlobePage = lazy(() => import("./pages/public/GlobePage"));
const CustomisePackagePage = lazy(() => import("./pages/public/CustomisePackagePage"));
const VisaEligibilityPage = lazy(() => import("./pages/public/VisaEligibilityPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/public/PrivacyPolicyPage"));
const NotFoundPage = lazy(() => import("./pages/public/NotFoundPage"));

// Auth Pages
const AdminLogin = lazy(() => import("./pages/auth/AdminLogin"));
const PortalLogin = lazy(() => import("./pages/auth/PortalLogin"));

// Admin Pages
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const LeadsListPage = lazy(() => import("./pages/admin/LeadsListPage"));
const LeadDetailPage = lazy(() => import("./pages/admin/LeadDetailPage"));
const VisaCasesListPage = lazy(() => import("./pages/admin/VisaCasesListPage"));
const CaseDetailPage = lazy(() => import("./pages/admin/CaseDetailPage"));
const AppointmentsPage = lazy(() => import("./pages/admin/AppointmentsPage"));
const QuotationsListPage = lazy(() => import("./pages/admin/QuotationsListPage"));
const QuotationBuilderPage = lazy(() => import("./pages/admin/QuotationBuilderPage"));
const PaymentsPage = lazy(() => import("./pages/admin/PaymentsPage"));
const StaffManagementPage = lazy(() => import("./pages/admin/StaffManagementPage"));
const ExpertsManagementPage = lazy(() => import("./pages/admin/ExpertsManagementPage"));
const ReportsPage = lazy(() => import("./pages/admin/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const VisaTypesListPage = lazy(() => import("./pages/admin/VisaTypesListPage"));
const VisaTypeEditorPage = lazy(() => import("./pages/admin/VisaTypeEditorPage"));
const VisaCheckerCms = lazy(() => import("./pages/admin/VisaCheckerCms"));
const AppPackagesListPage = lazy(() => import("./pages/admin/AppPackagesListPage"));
const AppPackageEditorPage = lazy(() => import("./pages/admin/AppPackageEditorPage"));
const AppVisasListPage = lazy(() => import("./pages/admin/AppVisasListPage"));
const AppVisaEditorPage = lazy(() => import("./pages/admin/AppVisaEditorPage"));
const AdminDocumentsPage = lazy(() => import("./pages/admin/AdminDocumentsPage"));

// Portal Pages
const PortalDashboard = lazy(() => import("./pages/portal/PortalDashboard"));
const PortalApplicationsPage = lazy(() => import("./pages/portal/PortalApplicationsPage"));
const PortalApplicationDetailPage = lazy(() => import("./pages/portal/PortalApplicationDetailPage"));
const PortalDocumentsPage = lazy(() => import("./pages/portal/PortalDocumentsPage"));
const PortalAppointmentsPage = lazy(() => import("./pages/portal/PortalAppointmentsPage"));
const PortalPaymentsPage = lazy(() => import("./pages/portal/PortalPaymentsPage"));
const PortalMessagesPage = lazy(() => import("./pages/portal/PortalMessagesPage"));
const PortalSettingsPage = lazy(() => import("./pages/portal/PortalSettingsPage"));
const PortalNotificationsPage = lazy(() => import("./pages/portal/PortalNotificationsPage"));
const SchengenWizard = lazy(() => import("./pages/portal/SchengenWizard"));
const PortalVerifyEmailPage = lazy(() => import("./pages/portal/PortalVerifyEmailPage"));
const PortalVerifyProfilePage = lazy(() => import("./pages/portal/PortalVerifyProfilePage"));
const PortalProfilePage = lazy(() => import("./pages/portal/PortalProfilePage"));
const PortalFamilyMembersPage = lazy(() => import("./pages/portal/PortalFamilyMembersPage"));

// Create Query Client with optimized caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      gcTime: 1000 * 60 * 10,   // Keep in memory 10 minutes
    }
  }
});

// Loading Fallback Component
const PageLoader = () => (
  <div className="min-h-screen bg-surface flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Route-level RBAC role groups — kept in sync with the sidebar definitions in
// src/layouts/AdminLayout.jsx (navSections[].roles) so that direct-URL access matches
// sidebar visibility. These gate the page client-side; Firestore rules remain the
// authoritative backstop for data.
const RBAC = {
  SALES: ["super_admin", "admin", "manager", "sales"],
  OPERATIONS: ["super_admin", "admin", "manager", "visa_ops"],
  APPOINTMENTS: ["super_admin", "admin", "manager", "sales", "visa_ops"],
  FINANCE: ["super_admin", "admin", "manager", "finance"],
  REPORTS: ["super_admin", "admin", "manager"],
  CONTENT: ["super_admin", "admin", "manager"],
  ADMIN_ONLY: ["super_admin", "admin"]
};

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <AuthProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Suspense fallback={<PageLoader />}>
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
                    <Route path="visa-eligibility" element={<VisaEligibilityPage />} />
                    <Route path="packages/customise" element={<CustomisePackagePage />} />
                    <Route path="privacy-policy" element={<PrivacyPolicyPage />} />

                    {/* EMAIL VERIFICATION (authenticated but unverified) */}
                    <Route
                      path="portal/verify-email"
                      element={
                        <ClientRoute>
                          <PortalVerifyEmailPage />
                        </ClientRoute>
                      }
                    />

                    {/* PROFILE VERIFICATION ONBOARDING (requires a verified email) */}
                    <Route
                      path="portal/verify-profile"
                      element={
                        <ClientRoute>
                          <RequireVerifiedEmail>
                            <PortalVerifyProfilePage />
                          </RequireVerifiedEmail>
                        </ClientRoute>
                      }
                    />

                    {/* CLIENT TRAVELLER PORTAL (requires verified email + complete profile) */}
                    <Route
                      path="portal"
                      element={
                        <ClientRoute>
                          <RequireVerifiedEmail>
                            <TravelerProfileProvider>
                              <PortalLayout />
                            </TravelerProfileProvider>
                          </RequireVerifiedEmail>
                        </ClientRoute>
                      }
                    >
                      {/* All portal features blocked until profile verification is complete */}
                      <Route element={<ProfileCompleteGuard><Outlet /></ProfileCompleteGuard>}>
                        <Route index element={<Navigate to="/portal/dashboard" replace />} />
                        <Route path="dashboard" element={<PortalDashboard />} />
                        <Route path="profile" element={<PortalProfilePage />} />
                        <Route path="family" element={<PortalFamilyMembersPage />} />
                        <Route path="applications" element={<PortalApplicationsPage />} />
                        <Route path="applications/:id" element={<PortalApplicationDetailPage />} />
                        <Route path="applications/:id/wizard" element={<SchengenWizard />} />
                        <Route path="documents" element={<PortalDocumentsPage />} />
                        <Route path="appointments" element={<PortalAppointmentsPage />} />
                        <Route path="payments" element={<PortalPaymentsPage />} />
                        <Route path="messages" element={<PortalMessagesPage />} />
                        <Route path="settings" element={<PortalSettingsPage />} />
                        <Route path="notifications" element={<PortalNotificationsPage />} />
                      </Route>
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
                    {/* Dashboard: all staff roles (no restriction) */}
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="leads" element={<ProtectedRoute roles={RBAC.SALES}><LeadsListPage /></ProtectedRoute>} />
                    <Route path="leads/:id" element={<ProtectedRoute roles={RBAC.SALES}><LeadDetailPage /></ProtectedRoute>} />
                    <Route path="cases" element={<ProtectedRoute roles={RBAC.OPERATIONS}><VisaCasesListPage /></ProtectedRoute>} />
                    <Route path="cases/:id" element={<ProtectedRoute roles={RBAC.OPERATIONS}><CaseDetailPage /></ProtectedRoute>} />
                    <Route path="documents" element={<ProtectedRoute roles={RBAC.OPERATIONS}><AdminDocumentsPage /></ProtectedRoute>} />
                    <Route path="appointments" element={<ProtectedRoute roles={RBAC.APPOINTMENTS}><AppointmentsPage /></ProtectedRoute>} />
                    <Route path="quotations" element={<ProtectedRoute roles={RBAC.FINANCE}><QuotationsListPage /></ProtectedRoute>} />
                    <Route path="quotations/new" element={<ProtectedRoute roles={RBAC.FINANCE}><QuotationBuilderPage /></ProtectedRoute>} />
                    <Route path="payments" element={<ProtectedRoute roles={RBAC.FINANCE}><PaymentsPage /></ProtectedRoute>} />
                    <Route path="staff" element={<ProtectedRoute roles={RBAC.ADMIN_ONLY}><StaffManagementPage /></ProtectedRoute>} />
                    <Route path="experts" element={<ProtectedRoute roles={["super_admin"]}><ExpertsManagementPage /></ProtectedRoute>} />
                    <Route path="reports" element={<ProtectedRoute roles={RBAC.REPORTS}><ReportsPage /></ProtectedRoute>} />
                    <Route path="settings" element={<ProtectedRoute roles={RBAC.ADMIN_ONLY}><SettingsPage /></ProtectedRoute>} />
                    <Route path="visa-types" element={<ProtectedRoute roles={RBAC.CONTENT}><VisaTypesListPage /></ProtectedRoute>} />
                    <Route path="visa-types/new" element={<ProtectedRoute roles={RBAC.CONTENT}><VisaTypeEditorPage /></ProtectedRoute>} />
                    <Route path="visa-types/:id/edit" element={<ProtectedRoute roles={RBAC.CONTENT}><VisaTypeEditorPage /></ProtectedRoute>} />

                    {/* App Content Section Routes */}
                    <Route path="app/packages" element={<ProtectedRoute roles={RBAC.CONTENT}><AppPackagesListPage /></ProtectedRoute>} />
                    <Route path="app/packages/new" element={<ProtectedRoute roles={RBAC.CONTENT}><AppPackageEditorPage /></ProtectedRoute>} />
                    <Route path="app/packages/:id/edit" element={<ProtectedRoute roles={RBAC.CONTENT}><AppPackageEditorPage /></ProtectedRoute>} />
                    <Route path="app/visa" element={<ProtectedRoute roles={RBAC.CONTENT}><AppVisasListPage /></ProtectedRoute>} />
                    <Route path="app/visa/new" element={<ProtectedRoute roles={RBAC.CONTENT}><AppVisaEditorPage /></ProtectedRoute>} />
                    <Route path="app/visa/:id/edit" element={<ProtectedRoute roles={RBAC.CONTENT}><AppVisaEditorPage /></ProtectedRoute>} />

                    {/* DYNAMIC CMS / CRM PORTAL TABS */}
                    <Route path="cms/visa-checker" element={<ProtectedRoute roles={RBAC.CONTENT}><VisaCheckerCms activeTab="cms" /></ProtectedRoute>} />
                    <Route path="crm/applications" element={<ProtectedRoute roles={RBAC.OPERATIONS}><VisaCheckerCms activeTab="applications" /></ProtectedRoute>} />
                    <Route path="crm/leads" element={<ProtectedRoute roles={RBAC.SALES}><VisaCheckerCms activeTab="leads" /></ProtectedRoute>} />
                    <Route path="settings/theme" element={<ProtectedRoute roles={RBAC.ADMIN_ONLY}><VisaCheckerCms activeTab="theme" /></ProtectedRoute>} />
                  </Route>

                  {/* CATCH-ALL REDIRECT */}
                  <Route path="*" element={<NotFoundPage />} />

                </Routes>
              </Suspense>
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
            <Analytics />
            <SpeedInsights />
          </AuthProvider>
        </AppProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
