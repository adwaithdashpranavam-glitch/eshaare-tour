import React, { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  LayoutDashboard, FileText, FolderOpen, Calendar, 
  CreditCard, MessageSquare, Settings, LogOut, Bell, Compass, Home
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
    { label: "Back to Home", path: "/", icon: Home },
    { label: "Dashboard", path: "/portal/dashboard", icon: LayoutDashboard },
    { label: "Applications", path: "/portal/applications", icon: FileText },
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
    <div className="min-h-[calc(100vh-6rem)] w-full bg-primary-container text-on-primary-container flex font-sans">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-primary-container border-r border-on-primary-fixed-variant/60 z-20 shrink-0">
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
      <div className="flex-grow flex flex-col min-w-0">
        {/* Router Outlet view */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
