import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppState, useAppDispatch } from "../contexts/AppContext";
import { 
  LayoutDashboard, Users, FileText, CalendarCheck, FileSpreadsheet, 
  CreditCard, ShieldAlert, BarChart3, Settings, LogOut, ChevronLeft, 
  ChevronRight, Search, Bell, Plus, Menu, X, HelpCircle, Compass, Globe
} from "lucide-react";
import toast from "react-hot-toast";

export const AdminLayout = () => {
  const { userProfile, logout } = useAuth();
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Force dark mode for admin portal
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      // Remove only if we navigate away to public website
      if (!window.location.pathname.startsWith("/admin") && !window.location.pathname.startsWith("/portal")) {
        document.documentElement.classList.remove("dark");
      }
    };
  }, [location.pathname]);

  const navSections = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard }
      ]
    },
    {
      title: "Sales",
      items: [
        { label: "Leads", path: "/admin/leads", icon: Users },
        { label: "Leads CRM", path: "/admin/crm/leads", icon: Users }
      ]
    },
    {
      title: "Operations",
      items: [
        { label: "Visa Cases", path: "/admin/cases", icon: FileText },
        { label: "Applications", path: "/admin/crm/applications", icon: FileSpreadsheet },
        { label: "Appointments", path: "/admin/appointments", icon: CalendarCheck }
      ]
    },
    {
      title: "Finance",
      items: [
        { label: "Quotations", path: "/admin/quotations", icon: FileSpreadsheet },
        { label: "Payments", path: "/admin/payments", icon: CreditCard }
      ]
    },
    {
      title: "Team",
      items: [
        { label: "Staff", path: "/admin/staff", icon: ShieldAlert }
      ]
    },
    {
      title: "Reports",
      items: [
        { label: "Analytics", path: "/admin/reports", icon: BarChart3 }
      ]
    },
    {
      title: "Website Content",
      items: [
        { label: "Visa Pages", path: "/admin/visa-types", icon: Globe },
        { label: "Visa Checker CMS", path: "/admin/cms/visa-checker", icon: Settings }
      ]
    },
    {
      title: "App Content",
      items: [
        { label: "Packages", path: "/admin/app/packages", icon: Compass },
        { label: "Visa", path: "/admin/app/visa", icon: Globe }
      ]
    },
    {
      title: "System",
      items: [
        { label: "Settings", path: "/admin/settings", icon: Settings },
        { label: "Theme & SEO CMS", path: "/admin/settings/theme", icon: Settings }
      ]
    }
  ];

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    // Redirect to leads list or cases list with query
    toast.success(`Searching CRM for: "${searchVal}"`);
    navigate(`/admin/leads?search=${encodeURIComponent(searchVal.trim())}`);
  };

  const handleQuickLead = () => {
    navigate("/admin/leads?add=true");
  };

  const handleLogoutClick = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const sidebarCollapsed = state.sidebarCollapsed;

  const toggleSidebar = () => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  };

  return (
    <div className="min-h-screen bg-primary-container text-on-primary-container flex font-sans">
      {/* Desktop Sidebar (Collapsible) */}
      <aside 
        className={`hidden md:flex flex-col bg-primary-container border-r border-on-primary-fixed-variant/65 transition-all duration-200 ${
          sidebarCollapsed ? "w-20" : "w-64"
        } relative z-20`}
      >
        {/* Sidebar Header Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-on-primary-fixed-variant">
          <Link to="/admin/dashboard" className="flex items-center space-x-2 truncate">
            <Compass className="h-6 w-6 text-secondary flex-shrink-0 animate-[spin_30s_linear_infinite]" />
            {!sidebarCollapsed && (
              <span className="font-display font-bold text-lg tracking-wider text-white">ESHAARE CRM</span>
            )}
          </Link>
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded bg-primary-container border border-on-primary-fixed-variant hover:bg-on-primary-fixed-variant text-on-primary-container/60"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-thin px-2">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              {!sidebarCollapsed && (
                <span className="text-[10px] font-bold text-on-primary-container/60 uppercase tracking-widest pl-2">
                  {section.title}
                </span>
              )}
              {section.items.map((item) => {
                const ItemIcon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
                      isActive
                        ? "bg-white/10 text-white border-l-2 border-secondary-fixed pl-2.5"
                        : "text-on-primary-container/80 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                    }`}
                    title={item.label}
                  >
                    <ItemIcon className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Profile Summary */}
        <div className="p-4 border-t border-on-primary-fixed-variant flex items-center justify-between">
          <div className="flex items-center space-x-2.5 truncate">
            <div className="h-9 w-9 rounded-full bg-secondary-container text-on-primary-fixed font-bold text-sm flex items-center justify-center flex-shrink-0">
              {userProfile?.name?.slice(0, 2).toUpperCase() || "ST"}
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate leading-tight">{userProfile?.name || "Staff Member"}</p>
                <span className="inline-block px-1.5 py-0.5 rounded-badge bg-secondary-container/10 border border-secondary/20 text-[9px] font-bold text-secondary mt-0.5 leading-none uppercase">
                  {userProfile?.role || "Agent"}
                </span>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={handleLogoutClick}
              className="p-1.5 rounded-lg text-on-primary-container/40 hover:text-danger hover:bg-danger/10 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Administrative Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-primary-container border-b border-on-primary-fixed-variant/60 flex items-center justify-between px-4 md:px-6 z-10">
          {/* Left: Mobile hamburger menu toggle */}
          <div className="flex items-center space-x-4 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 rounded bg-primary-container border border-on-primary-fixed-variant text-on-primary-container"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-display font-bold text-lg text-white">ESHAARE</span>
          </div>

          {/* Center: Global CRM Search */}
          <form onSubmit={handleGlobalSearch} className="hidden md:flex w-full max-w-sm relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-primary-container/40">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container placeholder-on-primary-container/60 rounded-button text-xs focus:outline-none focus:border-secondary"
              placeholder="Search leads, cases by name or phone..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </form>

          {/* Right Actions */}
          <div className="flex items-center space-x-3.5 ml-auto md:ml-0">
            {/* Bell Notifications */}
            <button 
              className="p-2 rounded-lg bg-primary-container border border-on-primary-fixed-variant text-on-primary-container/60 hover:text-white relative transition-colors"
              onClick={() => toast("No new notifications")}
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger animate-pulse"></span>
            </button>

            {/* Quick add lead button */}
            <button
              onClick={handleQuickLead}
              className="px-3.5 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-xs rounded-button flex items-center space-x-1.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(201,168,76,0.3)]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Lead</span>
            </button>
          </div>
        </header>

        {/* Router Outlet view */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex bg-primary-container/90 animate-[fadeIn_0.15s_ease-out]">
          <div className="w-64 bg-primary-container border-r border-on-primary-fixed-variant flex flex-col p-4 shadow-2xl relative animate-[slideLeft_0.2s_ease-out]">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-on-primary-container/50 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <Link to="/admin/dashboard" className="flex items-center space-x-2 mb-6" onClick={() => setMobileMenuOpen(false)}>
              <Compass className="h-5 w-5 text-secondary" />
              <span className="font-display font-bold text-lg text-white">ESHAARE CRM</span>
            </Link>

            <nav className="flex-1 overflow-y-auto space-y-4 pr-1">
              {navSections.map((sect, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <span className="text-[9px] font-bold text-on-primary-container/60 uppercase tracking-widest pl-2">
                    {sect.title}
                  </span>
                  {sect.items.map(item => {
                    const ItemIcon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                          isActive
                            ? "bg-white/10 text-white border-l-2 border-secondary-fixed pl-2"
                            : "text-on-primary-container/80 hover:text-white"
                        }`}
                      >
                        <ItemIcon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="pt-4 border-t border-on-primary-fixed-variant flex items-center justify-between mt-auto">
              <span className="text-xs font-bold text-white truncate">{userProfile?.name}</span>
              <button onClick={handleLogoutClick} className="text-on-primary-container/40 hover:text-danger">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-primary-container border-t border-on-primary-fixed-variant/80 md:hidden flex justify-around items-center h-16 px-2">
        {[
          { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
          { label: "Leads", path: "/admin/leads", icon: Users },
          { label: "Cases", path: "/admin/cases", icon: FileText },
          { label: "Appointments", path: "/admin/appointments", icon: CalendarCheck },
          { label: "Settings", path: "/admin/settings", icon: Settings }
        ].map((item) => {
          const TabIcon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 text-center w-12 transition-colors ${
                isActive ? "text-secondary" : "text-on-primary-container/50 hover:text-on-primary-container"
              }`}
            >
              <TabIcon className="h-5 w-5" />
              <span className="text-[9px] font-bold tracking-tight uppercase truncate w-full">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminLayout;
