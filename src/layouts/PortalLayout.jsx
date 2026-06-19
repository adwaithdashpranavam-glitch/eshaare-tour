import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard, FileText, FolderOpen, Calendar,
  CreditCard, MessageSquare, Settings, LogOut, Bell, Menu, X,
  UserCircle, Users
} from "lucide-react";
import toast from "react-hot-toast";
import foxLogo from "../assets/fox-logo.png";

export const PortalLayout = () => {
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Force LIGHT mode for luxury theme
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, [location.pathname]);

  const navItems = [
    { label: "Dashboard", path: "/portal/dashboard", icon: LayoutDashboard },
    { label: "My Profile", path: "/portal/profile", icon: UserCircle },
    { label: "Family Members", path: "/portal/family", icon: Users },
    { label: "Applications", path: "/portal/applications", icon: FileText },
    { label: "Documents", path: "/portal/documents", icon: FolderOpen },
    { label: "Payments", path: "/portal/payments", icon: CreditCard },
    { label: "Messages", path: "/portal/messages", icon: MessageSquare },
    { label: "Settings", path: "/portal/settings", icon: Settings }
  ];

  const handleLogoutClick = () => {
    logout();
    toast.success("Logged out from portal");
    navigate("/portal/login");
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.startsWith("/portal/dashboard")) {
      return ["Dashboard"];
    } else if (path.startsWith("/portal/profile")) {
      return ["Dashboard", "My Profile"];
    } else if (path.startsWith("/portal/family")) {
      return ["Dashboard", "Family Members"];
    } else if (path.startsWith("/portal/applications/")) {
      return ["Dashboard", "Applications", "Application Details"];
    } else if (path.startsWith("/portal/applications")) {
      return ["Dashboard", "Applications"];
    } else if (path.startsWith("/portal/appointments")) {
      return ["Dashboard", "Appointments"];
    } else if (path.startsWith("/portal/documents")) {
      return ["Dashboard", "Documents"];
    } else if (path.startsWith("/portal/payments")) {
      return ["Dashboard", "Payments"];
    } else if (path.startsWith("/portal/messages")) {
      return ["Dashboard", "Messages"];
    } else if (path.startsWith("/portal/settings")) {
      return ["Dashboard", "Settings"];
    } else if (path.startsWith("/portal/notifications")) {
      return ["Dashboard", "Notifications"];
    }
    return ["Dashboard"];
  };

  const getMonogram = (name) => {
    if (!name) return "CL";
    let cleanName = name.includes("@") ? name.split("@")[0] : name;
    const parts = cleanName.trim().split(/[\s._-]+/).filter(Boolean);
    if (parts.length === 0) return "CL";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const breadcrumbs = getBreadcrumbs();
  const userName = userProfile?.name || "Client";
  const userMonogram = getMonogram(userName);

  return (
    <div className="min-h-screen w-full bg-[#F8F6F2] text-[#1A1A1A] flex flex-col font-sans antialiased">
      {/* Top Header Bar */}
      <header className="h-16 w-full bg-white border-b border-[#E5E7EB] sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 shadow-sm">
        {/* Left: Eshaare Logo */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-[#1A1A1A]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          <Link to="/" className="flex items-center space-x-2 group">
            <img
              src={foxLogo}
              alt="Eshaare Tour"
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="leading-none">
              <h1 className="text-lg md:text-xl text-[#0F3D2E] font-bold" style={{ fontFamily: "'Great Vibes', cursive" }}>
                Eshaare Tour
              </h1>
              <p className="text-[5px] tracking-[0.25em] uppercase text-gray-500 font-semibold">
                Visa Concierge
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Breadcrumb Navigation */}
        <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-[#6B7280]">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb}>
                {idx > 0 && <span className="text-gray-300">/</span>}
                <span className={isLast ? "text-[#0F3D2E] font-semibold" : "hover:text-[#0F3D2E] transition-colors"}>
                  {crumb}
                </span>
              </React.Fragment>
            );
          })}
        </div>

        {/* Right: Notifications, Messages, Profile Avatar */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <Link 
            to="/portal/notifications" 
            className="p-2 text-gray-500 hover:text-[#0F3D2E] hover:bg-[#F8F6F2] rounded-full transition-all duration-200 relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C6A969] rounded-full"></span>
          </Link>
          
          <Link 
            to="/portal/messages" 
            className="p-2 text-gray-500 hover:text-[#0F3D2E] hover:bg-[#F8F6F2] rounded-full transition-all duration-200"
            title="Messages"
          >
            <MessageSquare className="h-5 w-5" />
          </Link>

          <Link 
            to="/portal/settings"
            className="h-9 w-9 rounded-full bg-[#0F3D2E]/10 border border-[#0F3D2E]/20 text-[#0F3D2E] font-bold text-xs flex items-center justify-center transition-all hover:border-[#C6A969] hover:bg-[#0F3D2E]/20 shadow-sm"
            title={`Profile: ${userName}`}
          >
            {userMonogram}
          </Link>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex relative">
        {/* Sidebar Container */}
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-[240px] bg-white border-r border-[#E5E7EB] shrink-0 sticky top-16 h-[calc(100vh-4rem)] z-20">
          <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const ItemIcon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== "/portal" && location.pathname.startsWith(`${item.path}/`));
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 relative ${
                    isActive
                      ? "bg-[#0F3D2E]/5 text-[#0F3D2E]"
                      : "text-[#6B7280] hover:text-[#0F3D2E] hover:bg-[#F8F6F2]"
                  }`}
                >
                  {/* Active Gold Indicator Bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#C6A969] rounded-r"></div>
                  )}
                  <ItemIcon className={`h-4.5 w-4.5 ${isActive ? "text-[#0F3D2E]" : "text-[#6B7280]"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-[#E5E7EB] bg-[#F8F6F2]/30 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 truncate min-w-0">
              <div className="h-8 w-8 rounded-full bg-[#0F3D2E] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                {userMonogram}
              </div>
              <div className="truncate min-w-0">
                <p className="text-xs font-bold text-[#1A1A1A] truncate leading-tight">{userName}</p>
                <span className="text-[9px] text-[#6B7280] font-medium tracking-wide">Visa Concierge Client</span>
              </div>
            </div>
            <button
              onClick={handleLogoutClick}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </aside>

        {/* Mobile Slide-Over Sidebar Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity" 
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Drawer Panel */}
            <div className="relative flex flex-col w-[240px] max-w-xs bg-white h-[calc(100vh-4rem)] mt-16 border-r border-[#E5E7EB] shadow-xl animate-[slideIn_0.2s_ease-out]">
              <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== "/portal" && location.pathname.startsWith(`${item.path}/`));
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 relative ${
                        isActive
                          ? "bg-[#0F3D2E]/5 text-[#0F3D2E]"
                          : "text-[#6B7280] hover:text-[#0F3D2E] hover:bg-[#F8F6F2]"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#C6A969] rounded-r"></div>
                      )}
                      <ItemIcon className={`h-4.5 w-4.5 ${isActive ? "text-[#0F3D2E]" : "text-[#6B7280]"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-[#E5E7EB] bg-[#F8F6F2]/30 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 truncate">
                  <div className="h-8 w-8 rounded-full bg-[#0F3D2E] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {userMonogram}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#1A1A1A] truncate leading-tight">{userName}</p>
                    <span className="text-[9px] text-[#6B7280]">Visa Client</span>
                  </div>
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-grow p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
