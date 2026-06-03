import React, { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  LayoutDashboard, FileText, FolderOpen, Calendar, 
  CreditCard, MessageSquare, Settings, LogOut, Bell, Compass 
} from "lucide-react";
import toast from "react-hot-toast";

export const PortalLayout = () => {
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Force dark mode for client portal
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      // Remove only if we navigate away to public website
      if (!window.location.pathname.startsWith("/admin") && !window.location.pathname.startsWith("/portal")) {
        document.documentElement.classList.remove("dark");
      }
    };
  }, [location.pathname]);

  const navItems = [
    { label: "Dashboard", path: "/portal/dashboard", icon: LayoutDashboard },
    { label: "Applications", path: "/portal/applications", icon: FileText },
    { label: "Documents", path: "/portal/documents", icon: FolderOpen },
    { label: "Appointments", path: "/portal/appointments", icon: Calendar },
    { label: "Payments", path: "/portal/payments", icon: CreditCard },
    { label: "Messages", path: "/portal/messages", icon: MessageSquare },
    { label: "Settings", path: "/portal/settings", icon: Settings }
  ];

  const handleLogoutClick = () => {
    logout();
    toast.success("Logged out from portal");
    navigate("/portal/login");
  };

  return (
    <div className="min-h-screen bg-primary-container text-on-primary-container flex font-sans">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-primary-container border-r border-on-primary-fixed-variant/60 z-20">
        <div className="h-16 flex items-center px-6 border-b border-on-primary-fixed-variant">
          <Link to="/portal/dashboard" className="flex items-center space-x-2">
            <Compass className="h-6 w-6 text-secondary animate-[spin_30s_linear_infinite]" />
            <span className="font-display font-bold text-lg text-white">Client Portal</span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const ItemIcon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center space-x-3.5 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-secondary-container/10 text-secondary border-l-2 border-secondary pl-3.5"
                    : "text-on-primary-container/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                }`}
              >
                <ItemIcon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-on-primary-fixed-variant flex items-center justify-between">
          <div className="flex items-center space-x-2.5 truncate">
            <div className="h-9 w-9 rounded-full bg-secondary-fixed text-on-primary-fixed font-bold text-sm flex items-center justify-center flex-shrink-0">
              {userProfile?.name?.slice(0, 2).toUpperCase() || "CL"}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate leading-tight">{userProfile?.name || "Client"}</p>
              <span className="text-[10px] text-on-primary-container/50">Traveller Account</span>
            </div>
          </div>
          <button
            onClick={handleLogoutClick}
            className="p-1.5 rounded-lg text-on-primary-container/40 hover:text-danger hover:bg-danger/10 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <header className="h-16 bg-primary-container border-b border-on-primary-fixed-variant/60 flex items-center justify-between px-6 z-10">
          <div className="md:hidden flex items-center space-x-2">
            <Compass className="h-5 w-5 text-secondary" />
            <span className="font-display font-bold text-base text-white">ESHAARE PORTAL</span>
          </div>

          <div className="hidden md:block">
            <h2 className="text-sm font-semibold text-on-primary-container/60">
              Welcome back, <span className="text-white font-bold">{userProfile?.name || "Client"}</span>
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications Bell */}
            <button 
              className="p-2 rounded-lg bg-primary-container border border-on-primary-fixed-variant text-on-primary-container/60 hover:text-white relative transition-colors"
              onClick={() => toast("No new notifications")}
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-secondary-container"></span>
            </button>
          </div>
        </header>

        {/* Router Outlet view */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sticky Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-primary-container border-t border-on-primary-fixed-variant/80 md:hidden flex justify-around items-center h-16 px-2">
        {navItems.slice(0, 5).map((item) => {
          const TabIcon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 text-center w-12 transition-colors ${
                isActive ? "text-secondary" : "text-on-primary-container/50"
              }`}
            >
              <TabIcon className="h-4.5 w-4.5" />
              <span className="text-[8px] font-bold tracking-tight uppercase truncate w-full">{item.label}</span>
            </Link>
          );
        })}
        {/* More Options overflow link (goes to settings) */}
        <Link
          to="/portal/settings"
          className={`flex flex-col items-center justify-center space-y-1 text-center w-12 transition-colors ${
            location.pathname === "/portal/settings" ? "text-secondary" : "text-on-primary-container/50"
          }`}
        >
          <Settings className="h-4.5 w-4.5" />
          <span className="text-[8px] font-bold tracking-tight uppercase truncate w-full">Settings</span>
        </Link>
      </nav>
    </div>
  );
};

export default PortalLayout;
