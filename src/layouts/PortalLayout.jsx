import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  LayoutDashboard, FileText, FolderOpen, Calendar, 
  CreditCard, MessageSquare, Settings, LogOut, Bell, Compass, Menu, X
} from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import toast from "react-hot-toast";

export const PortalLayout = () => {
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Remove dark mode class for the client portal
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    if (!userProfile?.id) return;
    const notifRef = collection(db, "notifications");
    const qNotif = query(notifRef, where("userId", "==", userProfile.id), where("read", "==", false));
    const unsubscribeNotif = onSnapshot(qNotif, (snapshot) => {
      setUnreadNotificationsCount(snapshot.size);
    }, (err) => {
      console.warn("Error loading notifications in layout:", err);
    });
    return () => unsubscribeNotif();
  }, [userProfile]);

  // Click outside listener to close user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const getMonogram = (name) => {
    if (!name) return "CL";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const userMonogram = getMonogram(userProfile?.name);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#101010] text-[#E7E1D6]">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
        <Link to="/portal/dashboard" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
          <Compass className="h-5.5 w-5.5 text-[#C8A45D]" />
          <span className="font-display font-semibold tracking-[0.15em] text-sm text-white uppercase">ESHAARE</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const ItemIcon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3.5 px-4 py-3 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 ${
                isActive
                  ? "bg-[#C8A45D]/10 text-[#C8A45D] border-l-4 border-[#C8A45D] pl-2.5"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
              }`}
            >
              <ItemIcon className="h-4.5 w-4.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all text-xs font-semibold uppercase tracking-wider"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="portal-root min-h-screen w-full bg-[#F7F5F1] text-[#1A1A1A] flex flex-col md:flex-row font-sans">
      
      {/* Desktop Sidebar (Left side, fixed width 220px) */}
      <aside className="hidden md:flex flex-col w-[220px] shrink-0 border-r border-[#E7E1D6]">
        {sidebarContent}
      </aside>

      {/* Mobile Header Bar */}
      <header className="md:hidden h-16 bg-[#101010] text-[#E7E1D6] px-4 flex items-center justify-between z-30 sticky top-0 border-b border-white/10">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="p-2 rounded-lg hover:bg-white/5 text-[#E7E1D6]"
          title="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
        </button>

        <Link to="/portal/dashboard" className="flex items-center space-x-2">
          <Compass className="h-5 w-5 text-[#C8A45D]" />
          <span className="font-display font-semibold tracking-wider text-xs uppercase text-white">ESHAARE</span>
        </Link>

        <Link to="/portal/notifications" className="p-2 relative rounded-lg hover:bg-white/5 text-[#E7E1D6]">
          <Bell className="h-5 w-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#C8A45D] rounded-full border-2 border-[#101010]" />
          )}
        </Link>
      </header>

      {/* Mobile Sidebar Slide Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          {/* Drawer Panel */}
          <div className="relative flex flex-col w-[240px] max-w-sm h-full bg-[#101010] animate-[slide-in-left_0.2s_ease-out]">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Right Column (Header & Main Content Area) */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Dedicated Portal Header (Desktop) */}
        <header className="hidden md:flex h-16 bg-white border-b border-[#E7E1D6] items-center justify-between px-8 z-20 sticky top-0 shadow-sm">
          {/* Left: Logo/Title */}
          <div>
            <h2 className="font-display font-semibold text-lg text-[#1A1A1A] tracking-wider uppercase flex items-center space-x-2">
              <span>Eshaare Concierge Portal</span>
            </h2>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-6">
            {/* Notifications */}
            <Link 
              to="/portal/notifications" 
              className="p-2 relative text-gray-500 hover:text-[#C8A45D] hover:bg-gray-50 rounded-full transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-[#C8A45D] text-white text-[9px] font-extrabold flex items-center justify-center rounded-full border border-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>

            {/* Profile & User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2.5 p-1.5 rounded-full hover:bg-gray-50 transition-all"
                title="User Account"
              >
                <div className="h-9 w-9 rounded-full bg-[#E7E1D6] hover:bg-[#C8A45D]/20 text-[#1A1A1A] font-bold text-xs flex items-center justify-center border border-[#C8A45D]/30 transition-all uppercase">
                  {userMonogram}
                </div>
              </button>

              {/* Dropdown User Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E7E1D6] rounded-xl shadow-lg py-2 z-30">
                  <div className="px-4 py-2 border-b border-[#E7E1D6] text-xs">
                    <p className="font-bold text-[#1A1A1A] truncate">{userProfile?.name || "Client Account"}</p>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{userProfile?.email}</p>
                  </div>
                  
                  <Link 
                    to="/portal/settings" 
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-4 py-2.5 text-xs text-[#1A1A1A] hover:bg-[#F7F5F1] hover:text-[#C8A45D] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span>Account Settings</span>
                  </Link>

                  <button 
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogoutClick();
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-[#F7F5F1] transition-colors border-t border-[#E7E1D6]/60 text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Pane */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
