import React, { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import {
  MapPin,
  Phone,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Menu,
  X,
  Home,
  Globe,
  Search,
  CalendarDays,
  User
} from "lucide-react";

export const PublicLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const userName = userProfile?.name || user?.displayName || user?.email || "Customer";
  const isPortal = location.pathname.startsWith("/portal");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const [mobileSubExpanded, setMobileSubExpanded] = useState(null);

  // Search state matching figma
  const [openSearch, setOpenSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  // Scroll handler for top header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (openSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 50);
    }
  }, [openSearch]);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Thank you for subscribing to our newsletter!");
    setEmail("");
  };

  const toggleMobileNav = (title) => {
    if (mobileExpanded === title) {
      setMobileExpanded(null);
      setMobileSubExpanded(null);
    } else {
      setMobileExpanded(title);
      setMobileSubExpanded(null);
    }
  };

  // Nav Data Structure
  const navData = [
    {
      title: "PRODUCTS",
      subcategories: [
        {
          title: "Visa Services",
          links: [
            "Schengen Visa",
            "UAE Visa",
            "UK Visa",
            "USA Visa",
            "Canada Visa",
            "Australia Visa",
            "Saudi Visa",
          ],
        },
        {
          title: "Holiday Packages",
          links: [
            "Europe Tours",
            "Maldives Packages",
            "Thailand Packages",
            "Bali Packages",
            "Turkey Packages",
            "Georgia Packages",
            "Japan Packages",
            "Honeymoon Packages",
            "Luxury Tours",
          ],
        },
        {
          title: "Flights",
          links: [],
        },
        {
          title: "Hotels",
          links: [],
        },
        {
          title: "Dubai Experiences",
          links: [
            "Burj Khalifa",
            "Palm Jumeirah",
            "Dubai Frame",
            "Burj Al Arab",
            "Museum of the Future",
          ],
        },
        {
          title: "Travel Insurance",
          links: ["Apply Online", "Request Callback"],
        },
      ],
    },
    {
      title: "APPOINTMENTS",
      path: "/appointment"
    },
    {
      title: "DOCUMENTATION",
      path: "/resources"
    },
    {
      title: "ABOUT US",
      path: "/about"
    },
    {
      title: "CONTACT US",
      path: "/contact"
    }
  ];

  // Slug conversion mapping helper
  const toSlug = (text) => {
    const t = text.trim();
    if (t === "Home") return "/";
    if (t === "About Us") return "/about";
    if (t === "Contact Us" || t === "Request Callback") return "/contact";
    if (t === "Appointments" || t === "APPOINTMENTS") return "/appointment";
    if (t === "Documentation" || t === "DOCUMENTATION") return "/resources";

    // Visas
    if (t === "Visa Services") return "/visa-services";
    if (
      t === "Schengen Visa" ||
      t === "UK Visa" ||
      t === "USA Visa" ||
      t === "Japan Visa" ||
      t === "UAE Visa" ||
      t === "Canada Visa" ||
      t === "Australia Visa" ||
      t === "Saudi Visa"
    ) {
      const slug = t.toLowerCase().split(" ")[0];
      return `/visa-services/${slug}`;
    }

    // Packages
    if (t === "Holiday Packages" || t.endsWith("Packages") || t.endsWith("Tours")) {
      if (t === "Europe Tours") return "/packages/classic-paris-rome";
      if (t === "Japan Packages") return "/packages/tokyo-kyoto-cultural";
      return "/packages";
    }

    if (t === "Flights") return "/contact";
    if (t === "Hotels") return "/contact";
    if (t === "Dubai Experiences") return "/packages";

    // Attractions
    if (
      t === "Burj Khalifa" ||
      t === "Palm Jumeirah" ||
      t === "Dubai Frame" ||
      t === "Burj Al Arab" ||
      t === "Museum of the Future"
    ) {
      return "/packages";
    }

    if (t === "Travel Insurance" || t === "Apply Online") {
      return "/appointment";
    }

    return "/";
  };

  // Search items database for real-time matches inside popup
  const searchItems = [
    { type: "Visa", name: "Schengen Europe Visa Support", path: "/visa-services/schengen", keywords: ["europe", "schengen", "france", "germany", "italy", "switzerland", "visa"] },
    { type: "Visa", name: "United Kingdom (UK) Visa Support", path: "/visa-services/uk", keywords: ["uk", "london", "england", "scotland", "united kingdom", "visa"] },
    { type: "Visa", name: "United States (USA) Visa Support", path: "/visa-services/usa", keywords: ["usa", "us", "america", "united states", "b1", "b2", "visa"] },
    { type: "Visa", name: "Japan Visa Support", path: "/visa-services/japan", keywords: ["japan", "tokyo", "kyoto", "asia", "visa"] },
    { type: "Visa", name: "Canada Visa Support", path: "/visa-services/canada", keywords: ["canada", "toronto", "vancouver", "visa"] },
    { type: "Visa", name: "Australia Visa Support", path: "/visa-services/australia", keywords: ["australia", "sydney", "melbourne", "visa"] },
    { type: "Visa", name: "Saudi Arabia Visa Support", path: "/visa-services/saudi", keywords: ["saudi", "arabia", "mecca", "riyadh", "visa"] },
    { type: "Visa", name: "UAE Visa Support & Residency", path: "/visa-services/uae", keywords: ["uae", "dubai", "abu dhabi", "sharjah", "visa"] },
    { type: "Package", name: "Classic Paris & Rome Explorer", path: "/packages/classic-paris-rome", keywords: ["paris", "rome", "europe", "france", "italy", "package", "tour"] },
    { type: "Package", name: "Tokyo & Kyoto Cultural Escape", path: "/packages/tokyo-kyoto-cultural", keywords: ["tokyo", "kyoto", "japan", "asia", "package", "tour"] },
    { type: "Package", name: "Magical London & Edinburgh", path: "/packages/magical-london-scotland", keywords: ["london", "edinburgh", "uk", "scotland", "package", "tour"] },
    { type: "Service", name: "Book VFS / Embassy Appointment", path: "/appointment", keywords: ["book", "appointment", "vfs", "bls", "slot", "date"] },
    { type: "Service", name: "Track Application Status", path: "/track", keywords: ["track", "status", "passport", "application"] },
    { type: "Service", name: "Documentation Checklist", path: "/resources", keywords: ["documentation", "checklist", "resources", "noc"] }
  ];

  // Filtering search results inside popover
  const filteredSearchResults = searchQuery
    ? searchItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords.some((kw) => kw.includes(searchQuery.toLowerCase()))
    )
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body-md text-on-surface">

      {/* Welcome Banner if authenticated */}
      {user && (
        <div className="fixed top-0 left-0 w-full z-50 h-8 bg-gradient-to-r from-[#2B2723] via-[#1D503A] to-[#2B2723] text-gray-300 text-xs px-4 xl:px-8 flex items-center justify-between border-b border-amber-500/10 font-medium tracking-wide shadow-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>
              Welcome,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1D503A] to-amber-300 font-extrabold uppercase tracking-wider">
                {userName}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Sticky Top Navbar */}
      <header
        className={`fixed left-0 w-full z-50 transition-all duration-300 ${scrolled
          ? "bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100"
          : "bg-white/90 backdrop-blur-xl shadow-md border-b border-gray-100"
          } ${user ? "top-8" : "top-0"}`}
      >

        <div className="max-w-[95rem] mx-auto px-4 xl:px-6 h-16 flex items-center justify-between">

          {/* Logo with MapPin */}
          <div className="flex items-center gap-3">
            {location.pathname && location.pathname !== "/" && (
              <button
                onClick={() => navigate(-1)}
                className="mr-1 flex items-center justify-center p-2 rounded-full hover:bg-gray-200/50 text-gray-800 transition-colors"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}

            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="relative">
                <MapPin className="h-5 w-5 text-[#1D503A]" />
                <div className="absolute -top-1 -right-2 w-2 h-2 bg-[#1D503A] rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight leading-none">
                  <span className="text-[#1D503A]">ESHAARE</span>
                  <span className="text-[#1D503A] ml-1">TOUR</span>
                </h1>
                <p className="text-[10px] tracking-wider text-gray-800 font-semibold mt-1">
                  TOURS & EVENTS
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 ml-8">
            {navData.map((navItem) => (
              <div key={navItem.title} className="relative group/main py-8">
                {navItem.subcategories ? (
                  <>
                    <button className="text-gray-800 group-hover/main:text-[#1D503A] transition text-[10px] xl:text-sm font-semibold uppercase tracking-wide flex items-center gap-1 cursor-pointer">
                      {navItem.title}
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {/* Multi-level Hover Flyout Dropdown */}
                    <div className="absolute top-[70px] left-0 w-64 bg-white border border-gray-100 shadow-xl rounded-xl opacity-0 invisible group-hover/main:opacity-100 group-hover/main:visible transition-all duration-300 py-2">
                      {navItem.subcategories.map((sub) => (
                        <div key={sub.title} className="relative group/sub">
                          {sub.links && sub.links.length > 0 ? (
                            <>
                              <Link
                                to={toSlug(sub.title)}
                                className="px-5 py-3 hover:bg-orange-50/50 hover:text-[#1D503A] flex items-center justify-between text-sm font-medium text-gray-700 transition-colors"
                              >
                                {sub.title}
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover/sub:text-[#1D503A]" />
                              </Link>

                              <div className="absolute top-0 left-full -ml-1 w-60 bg-white border border-gray-100 shadow-xl rounded-xl opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-300 py-2">
                                {sub.links.map((link) => (
                                  <Link
                                    key={link}
                                    to={toSlug(link)}
                                    className="block px-5 py-2.5 hover:bg-orange-50/50 hover:text-[#1D503A] text-sm text-gray-600 transition-colors"
                                  >
                                    {link}
                                  </Link>
                                ))}
                              </div>
                            </>
                          ) : (
                            <Link
                              to={toSlug(sub.title)}
                              className="block px-5 py-3 hover:bg-orange-50/50 hover:text-[#1D503A] text-sm font-medium text-gray-700 transition-colors"
                            >
                              {sub.title}
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link
                    to={navItem.path}
                    className="text-gray-800 hover:text-[#1D503A] transition text-[10px] xl:text-sm font-semibold uppercase tracking-wide flex items-center gap-1"
                  >
                    {navItem.title}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop Right Side CTA Actions */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-4 shrink-0">
            {!user ? (
              <Link
                to="/portal/login"
                className="h-9 border border-[#1D503A] hover:bg-[#1D503A]/10 text-gray-800 px-6 rounded-full font-semibold text-sm flex items-center justify-center transition-all duration-300"
              >
                Login
              </Link>
            ) : (
              <Link
                to="/portal"
                className="h-9 border border-gray-300 hover:bg-gray-100 text-gray-800 px-6 rounded-full font-semibold text-sm flex items-center justify-center transition-all duration-300"
              >
                Dashboard
              </Link>
            )}

            <Link
              to="/appointment"
              className="group relative flex items-center gap-2 h-9 bg-[#1D503A] border border-[#1D503A] text-white px-5 rounded-full font-semibold text-sm hover:bg-[#0e4a1e] transition-all duration-300 overflow-hidden shadow-md"
            >
              <Phone className="h-4 w-4" />
              <span>Enquire Now</span>
            </Link>

            {/* Profile Avatar / ES monogram */}
            <Link
              to="/portal"
              className="h-11 w-11 rounded-full border border-gray-200 shadow-sm bg-orange-50 flex items-center justify-center font-bold text-xs text-[#1D503A] hover:bg-orange-100/50 transition-colors"
              title="User Portal"
            >
              ES
            </Link>
          </div>

          {/* Mobile Hamburg Trigger */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/40 backdrop-blur-sm pt-20">
          <div className="bg-white max-h-[calc(100vh-80px)] overflow-y-auto shadow-xl p-4 flex flex-col gap-2">
            {navData.map((navItem) => (
              <div key={navItem.title} className="border-b border-gray-50 last:border-0">
                {navItem.subcategories ? (
                  <>
                    <button
                      onClick={() => toggleMobileNav(navItem.title)}
                      className="w-full py-4 flex items-center justify-between text-sm font-bold text-gray-800 hover:text-[#1D503A]"
                    >
                      <span>{navItem.title}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${mobileExpanded === navItem.title ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    {mobileExpanded === navItem.title && (
                      <div className="pb-3 pl-4 pr-4">
                        {navItem.subcategories.map((sub) => (
                          <div key={sub.title} className="mt-1">
                            {sub.links && sub.links.length > 0 ? (
                              <>
                                <button
                                  onClick={() =>
                                    setMobileSubExpanded(
                                      mobileSubExpanded === sub.title ? null : sub.title
                                    )
                                  }
                                  className="w-full py-2.5 flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-[#1D503A]"
                                >
                                  <span>{sub.title}</span>
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 transition-transform ${mobileSubExpanded === sub.title ? "rotate-180" : ""
                                      }`}
                                  />
                                </button>

                                {mobileSubExpanded === sub.title && (
                                  <div className="pl-4 pr-4 py-1 flex flex-col gap-1 border-l-2 border-orange-100 ml-2">
                                    {sub.links.map((link) => (
                                      <Link
                                        key={link}
                                        to={toSlug(link)}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="py-2 text-[13px] text-gray-600 hover:text-[#1D503A] block"
                                      >
                                        {link}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (
                              <Link
                                to={toSlug(sub.title)}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-2.5 text-sm font-semibold text-gray-700 hover:text-[#1D503A]"
                              >
                                {sub.title}
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={navItem.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-4 text-sm font-bold text-gray-800 hover:text-[#1D503A]"
                  >
                    {navItem.title}
                  </Link>
                )}
              </div>
            ))}

            {/* Mobile Actions Drawer CTA */}
            <div className="mt-6 flex flex-col gap-3 pb-8">
              {!user ? (
                <Link
                  to="/portal/login"
                  className="border border-[#1D503A] text-gray-800 py-3 rounded-full text-center font-semibold text-sm hover:bg-orange-50/50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              ) : (
                <Link
                  to="/portal"
                  className="border border-gray-300 text-gray-800 py-3 rounded-full text-center font-semibold text-sm hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}

              <Link
                to="/appointment"
                className="bg-[#1D503A] text-white py-3 rounded-full text-center font-semibold text-sm shadow-md hover:bg-[#0e4a1e]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Enquire Now
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* Main Page Layout Content */}
      <main className={isPortal ? "flex-grow pt-24" : `flex-grow pb-24 md:pb-8 ${user ? "pt-24" : "pt-16"}`}>
        <Outlet />
      </main>

      {/* Footer matching figma style colorings */}
      {!isPortal && (
        <footer className="bg-primary-container text-on-primary-container pt-16 pb-32">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-4 gap-gutter mb-12">
            {/* Brand Col */}
            <div className="flex flex-col gap-4">
              <Link to="/" className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white text-3xl font-bold">location_on</span>
                <span className="font-headline-md font-bold text-white tracking-tight">
                  ESHAAR TOUR
                </span>
              </Link>
              <p className="text-body-sm leading-relaxed text-on-primary-container/80">
                Premium visa processing assistance & curated luxury tour packages for UAE residents. Your gateway to global travel.
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col gap-4">
              <h4 className="text-white font-headline-md text-body-lg font-semibold">Services</h4>
              <ul className="flex flex-col gap-2.5 text-body-sm">
                <li>
                  <Link to="/visa-services" className="text-on-primary-container/80 hover:text-secondary-fixed transition-colors">
                    Visa Services
                  </Link>
                </li>
                <li>
                  <Link to="/packages" className="text-on-primary-container/80 hover:text-[#1D503A] transition-colors">
                    Tour Packages
                  </Link>
                </li>
                <li>
                  <Link to="/destinations" className="text-on-primary-container/80 hover:text-[#1D503A] transition-colors">
                    Destinations
                  </Link>
                </li>
                <li>
                  <Link to="/resources" className="text-on-primary-container/80 hover:text-[#1D503A] transition-colors">
                    Documentation Guide
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div className="flex flex-col gap-4">
              <h4 className="text-white font-headline-md text-body-lg font-semibold">Support</h4>
              <ul className="flex flex-col gap-2.5 text-body-sm">
                <li>
                  <Link to="/track" className="text-on-primary-container/80 hover:text-[#1D503A] transition-colors">
                    Track Application
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-on-primary-container/80 hover:text-[#1D503A] transition-colors">
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-on-primary-container/80 hover:text-[#1D503A] transition-colors">
                    Staff Login
                  </Link>
                </li>
                <li>
                  <Link to="/portal/login" className="text-on-primary-container/80 hover:text-[#1D503A] transition-colors">
                    Client Portal
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="flex flex-col gap-4">
              <h4 className="text-white font-headline-md text-body-lg font-semibold">Newsletter</h4>
              <p className="text-body-sm leading-relaxed text-on-primary-container/80">
                Subscribe to get the latest visa news updates and luxury tour package offers.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  className="flex-grow px-3 py-2 bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 text-body-sm rounded-lg border border-outline-variant/10 focus:outline-none"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-[#1D503A] text-white px-4 py-2 rounded-lg font-label-md hover:bg-[#0e4a1e] transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-body-sm text-on-primary-container/60">
            <p>Â© {new Date().getFullYear()} Eshaare Tours UAE. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-secondary-fixed transition-colors">Instagram</a>
              <a href="https://wa.me/971501234567" target="_blank" rel="noreferrer" className="hover:text-secondary-fixed transition-colors">WhatsApp</a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-secondary-fixed transition-colors">Facebook</a>
            </div>
          </div>
        </footer>
      )}

      {/* WhatsApp FAB */}
      {!isPortal && (
        <a
          href="https://wa.me/971501234567"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-8 right-8 w-16 h-16 bg-whatsapp-green text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 z-[100] transition-transform animate-pulse"
          title="Chat on WhatsApp"
        >
          <span className="material-symbols-outlined text-3xl">chat</span>
        </a>
      )}

      {/* FIGMA DESIGN FIXED BOTTOM NAVBAR */}
      <div className="fixed bottom-1 left-1/2 z-[9999] w-[75%] max-w-2xl -translate-x-1/2 rounded-full border border-white/10 bg-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.15)] backdrop-blur-xl">
        <div className="grid grid-cols-5 items-center py-1">

          {/* GLOBE */}
          <Link
            to="/globe"
            className="flex flex-col items-center justify-center gap-1 text-xs text-gray-700 transition hover:text-[#1D503A]"
          >
            <Globe size={17} />
            <span>Globe</span>
          </Link>

          {/* HOME */}
          <Link
            to="/"
            className="flex flex-col items-center justify-center gap-1 text-xs text-gray-700 transition hover:text-[#1D503A]"
          >
            <Home size={17} />
            <span>Home</span>
          </Link>

          {/* SEARCH */}
          <button
            onClick={() => setOpenSearch(true)}
            className="-mt-8 mx-auto flex h-12 w-12 flex-col items-center justify-center rounded-full
  bg-[#1D503A]
  text-white
  border-2 border-[#7FE6A2]
  ring-4 ring-[#7FE6A2]/30
  shadow-[0_0_25px_rgba(127,230,162,0.6)]
  transition hover:scale-105"
          >
            <Search size={16} />
            <span className="mt-1 text-[9px] font-medium">Search</span>
          </button>

          {/* EVENTS */}
          <Link
            to="/packages"
            className="flex flex-col items-center justify-center gap-1 text-xs text-gray-700 transition hover:text-[#1D503A]"
          >
            <CalendarDays size={17} />
            <span>Events</span>
          </Link>

          {/* ACCOUNT */}
          <Link
            to={user ? "/portal" : "/portal/login"}
            className="flex flex-col items-center justify-center gap-1 text-xs text-gray-700 transition hover:text-[#1D503A]"
          >
            <User size={17} />
            <span>Account</span>
          </Link>

        </div>
      </div>

      {/* FIGMA DESIGN SEARCH POPUP */}
      {openSearch && (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl flex flex-col gap-4">

            {/* Input pill */}
            <div className="flex h-14 items-center overflow-hidden rounded-full bg-white shadow-2xl border border-gray-100">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search destinations, tours, events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 text-lg text-black outline-none bg-white h-full"
              />
              <button className="mr-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#1D503A] text-white shrink-0 hover:bg-[#0e4a1e] transition-colors">
                <Search size={21} />
              </button>
            </div>

            {/* Live Matches List */}
            {searchQuery && (
              <div className="bg-white rounded-2xl p-4 shadow-2xl border border-outline-variant/15 flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Matches</span>
                {filteredSearchResults.length > 0 ? (
                  filteredSearchResults.map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setOpenSearch(false);
                        setSearchQuery("");
                        navigate(result.path);
                      }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-orange-50/50 cursor-pointer transition-colors border border-transparent hover:border-orange-100/10"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#1D503A]">
                          {result.type === "Visa" ? <Globe size={18} /> : result.type === "Package" ? <CalendarDays size={18} /> : <User size={18} />}
                        </span>
                        <div>
                          <p className="text-body-sm font-semibold text-primary leading-tight">{result.name}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{result.type}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#1D503A]" />
                    </div>
                  ))
                ) : (
                  <p className="text-body-sm text-gray-500 text-center py-6">
                    No matching visas or holiday packages found.
                  </p>
                )}
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => {
                setOpenSearch(false);
                setSearchQuery("");
              }}
              className="mx-auto mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg hover:scale-105 transition-transform"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PublicLayout;

