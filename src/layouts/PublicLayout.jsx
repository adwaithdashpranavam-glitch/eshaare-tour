import React, { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import foxLogo from "../assets/fox-logo.webp";
import { useAuth } from "../contexts/AuthContext";
import CanonicalTag from "../components/CanonicalTag";
import {
  InstagramIcon,
  WhatsappIcon,
  FacebookIcon,
  LinkedinIcon,
  TelegramIcon
} from "../components/ui/BrandIcons";
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
  User,
  Send
} from "lucide-react";

export const PublicLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, isAdmin, loading } = useAuth();
  const userName = userProfile?.name || user?.displayName || user?.email || "Customer";
  const isPortal = location.pathname.startsWith("/portal");

  // Redirect admin users to admin dashboard if they land on the home page root
  useEffect(() => {
    if (user && isAdmin && !loading && location.pathname === "/") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, isAdmin, loading, location.pathname, navigate]);

  const getMonogram = (name) => {
    if (!name) return "";
    let cleanName = name;
    if (name.includes("@")) {
      cleanName = name.split("@")[0];
    }
    const parts = cleanName.trim().split(/[\s._-]+/).filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const userMonogram = getMonogram(userName);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const [mobileSubExpanded, setMobileSubExpanded] = useState(null);
  const [mobileSubSubExpanded, setMobileSubSubExpanded] = useState(null);
  const [footerInView, setFooterInView] = useState(false);
  const footerRef = useRef(null);

  // Search state matching figma
  const [openSearch, setOpenSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  // Tooltip state for WhatsApp FAB
  const [showTooltip, setShowTooltip] = useState(false);

  const [heroTheme, setHeroTheme] = useState("dark");
  useEffect(() => {
    const handleTheme = (e) => setHeroTheme(e.detail);
    window.addEventListener("heroThemeChange", handleTheme);
    return () => window.removeEventListener("heroThemeChange", handleTheme);
  }, []);

  // Auto-show and hide tooltip on page load
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShowTooltip(true);
    }, 1500);

    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 9500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Scroll handler for top header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setPastHero(window.scrollY > window.innerHeight * 0.75);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer to detect when footer is in view
  useEffect(() => {
    if (!footerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setFooterInView(entry.isIntersecting);
      },
      { rootMargin: "0px", threshold: 0 }
    );
    observer.observe(footerRef.current);
    return () => observer.disconnect();
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
      setMobileSubSubExpanded(null);
    } else {
      setMobileExpanded(title);
      setMobileSubExpanded(null);
      setMobileSubSubExpanded(null);
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
            "UK Visa",
            "USA Visa",
            {
              title: "Schengen Visa",
              links: [
                "France Visa",
                "Italy Visa",
                "Germany Visa",
                "Spain Visa",
                "Netherlands Visa",
                "Switzerland Visa"
              ]
            },
            {
              title: "GCC / Middle East Visa",
              links: [
                "UAE Visa",
                "Saudi Arabia Visa",
                "Oman Visa"
              ]
            },
            {
              title: "Asia Visa",
              links: [
                "Japan Visa",
                "Korea Visa",
                "Vietnam Visa"
              ]
            },
            {
              title: "Oceania Visa",
              links: [
                "Australia Visa",
                "New Zealand Visa"
              ]
            }
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
            "Customise Package",
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
      title: "ELIGIBILITY",
      path: "/visa-eligibility"
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
    if (t === "Customise Package") return "/packages/customise";
    if (t === "Home") return "/";
    if (t === "About Us") return "/about";
    if (t === "Contact Us" || t === "Request Callback") return "/contact";
    if (t === "Appointments" || t === "APPOINTMENTS") return "/appointment";
    if (t === "Documentation" || t === "DOCUMENTATION") return "/resources";
    if (t === "Eligibility" || t === "ELIGIBILITY") return "/visa-eligibility";

    // Visas
    if (t === "Visa Services") return "/visa-services";
    if (t.endsWith(" Visa")) {
      const name = t.replace(" Visa", "").toLowerCase().trim();
      if (name === "saudi arabia" || name === "saudi") return "/visa-services/saudi";
      if (name === "new zealand") return "/visa-services/new-zealand";
      if (name === "gcc / middle east") return "/visa-services/gcc-middle-east";
      if (name === "asia") return "/visa-services/asia";
      if (name === "oceania") return "/visa-services/oceania";
      return `/visa-services/${name.replace(/\s+/g, "-")}`;
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

    if (t === "Travel Insurance") {
      return "/contact";
    }

    if (t === "Apply Online") {
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

  const isHome = location.pathname === "/";
  const applyHeroTheme = isHome && !pastHero;

  let headerBgClass = scrolled
    ? "bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100"
    : "bg-white/90 backdrop-blur-xl shadow-md border-b border-gray-100";
  let navTextColor = "text-gray-800";
  let navBrandColor = "text-[#1D503A]";
  let navHoverColor = "group-hover/main:text-[#1D503A]";
  let navSubtextClass = "text-gray-600";
  let btnLoginClass = "border-[#1D503A] hover:bg-[#1D503A]/10 text-gray-800";
  let backBtnClass = "hover:bg-gray-200/50 text-gray-800";
  let hamburgerClass = "text-gray-700 bg-gray-100 hover:bg-gray-200";

  if (applyHeroTheme) {
    if (heroTheme === "dark") {
      headerBgClass = "bg-[#162721]/90 backdrop-blur-xl shadow-md border-b border-white/10";
      navTextColor = "text-white";
      navBrandColor = "text-white";
      navHoverColor = "group-hover/main:text-gray-300";
      navSubtextClass = "text-gray-300";
      btnLoginClass = "border-white hover:bg-white/10 text-white";
      backBtnClass = "hover:bg-white/20 text-white";
      hamburgerClass = "text-white bg-white/10 hover:bg-white/20";
    } else if (heroTheme === "split") {
      headerBgClass = "bg-[#fdfaf2]/95 backdrop-blur-xl shadow-md border-b border-[#e8dac1]";
      navTextColor = "text-[#3a2f26]";
      navBrandColor = "text-[#1D503A]";
      navHoverColor = "group-hover/main:text-[#1D503A]";
      navSubtextClass = "text-[#7a6b5c]";
      btnLoginClass = "border-[#3a2f26] hover:bg-[#3a2f26]/10 text-[#3a2f26]";
      backBtnClass = "hover:bg-[#e8dac1]/50 text-[#3a2f26]";
      hamburgerClass = "text-[#3a2f26] bg-[#3a2f26]/10 hover:bg-[#3a2f26]/20";
    } else {
      headerBgClass = "bg-[#fff0f3]/95 backdrop-blur-xl shadow-md border-b border-[#ffccd5]";
      navTextColor = "text-[#5c2438]";
      navBrandColor = "text-[#5c2438]";
      navHoverColor = "group-hover/main:text-[#5c2438]";
      navSubtextClass = "text-[#9c5f74]";
      btnLoginClass = "border-[#5c2438] hover:bg-[#5c2438]/10 text-[#5c2438]";
      backBtnClass = "hover:bg-[#ffccd5]/50 text-[#5c2438]";
      hamburgerClass = "text-[#5c2438] bg-[#5c2438]/10 hover:bg-[#5c2438]/20";
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body-md text-on-surface">
      <CanonicalTag />
      {/* Siri Orb Keyframe Animations */}
      <style>{`
        @keyframes orb-morph-1 {
          0%, 100% {
            transform: translate(0px, 0px) scale(1) rotate(0deg);
            border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%;
          }
          33% {
            transform: translate(-3px, 3px) scale(1.08) rotate(120deg);
            border-radius: 70% 30% 52% 48% / 60% 40% 60% 40%;
          }
          66% {
            transform: translate(3px, -3px) scale(0.95) rotate(240deg);
            border-radius: 30% 70% 40% 60% / 50% 60% 40% 50%;
          }
        }

        @keyframes orb-morph-2 {
          0%, 100% {
            transform: translate(0px, 0px) scale(1) rotate(0deg);
            border-radius: 50% 50% 30% 70% / 50% 60% 40% 50%;
          }
          33% {
            transform: translate(3px, -3px) scale(0.95) rotate(-120deg);
            border-radius: 30% 70% 70% 30% / 50% 30% 70% 50%;
          }
          66% {
            transform: translate(-3px, 3px) scale(1.08) rotate(-240deg);
            border-radius: 60% 40% 30% 70% / 40% 60% 50% 60%;
          }
        }

        @keyframes orb-morph-3 {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
            border-radius: 50%;
          }
          50% {
            transform: translate(2px, 2px) scale(1.12);
            border-radius: 45% 55% 45% 55%;
          }
        }

        @keyframes orb-float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .siri-orb-float {
          animation: orb-float 4s ease-in-out infinite;
        }
      `}</style>

      {/* Welcome Banner if authenticated */}
      {user && !isPortal && (
        <div className="fixed top-0 left-0 w-full z-50 h-8 bg-gradient-to-r from-[#2B2723] via-[#1D503A] to-[#2B2723] text-gray-300 text-xs px-4 xl:px-8 flex items-center justify-between border-b border-amber-500/10 font-medium tracking-wide shadow-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>
              Welcome,{" "}
              <span className="text-amber-300 font-extrabold uppercase tracking-wider">
                {userName}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Sticky Top Navbar */}
      {!isPortal && (
        <header
          className={`fixed left-0 w-full z-50 transition-all duration-700 ${headerBgClass} ${user ? "top-8" : "top-0"}`}
        >

          <div className="max-w-[95rem] mx-auto px-2 xl:px-4 h-16 flex items-center justify-between">

            {/* Logo with MapPin */}
            <div className="flex items-center gap-1 sm:gap-3 min-w-0">
              {location.pathname && location.pathname !== "/" && (
                <button
                  onClick={() => navigate(-1)}
                  className={`mr-1 flex items-center justify-center p-2 rounded-full transition-colors duration-700 ${backBtnClass}`}
                  title="Go Back"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}
              <Link
                to="/"
                className="flex items-center gap-1 sm:gap-2 group shrink-0"
              >
                <img
                  src={foxLogo}
                  alt="Eshaare Tour"
                  width="90"
                  height="60"
                  className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />

                {/* Brand Text */}
                <div className="leading-none -ml-2.5 md:-ml-4">
                  <div
                    className={`text-xl sm:text-xl md:text-3xl lg:text-4xl transition-colors duration-700 ${navBrandColor}`}
                    style={{
                      fontFamily: "'Great Vibes', cursive",
                    }}
                    aria-label="Eshaare Tours & Visas"
                  >
                    Eshaare Tour
                  </div>

                  <p className={`text-[5px] sm:text-[6px] md:text-[7px] lg:text-[8px] tracking-[0.25em] uppercase mt-0 transition-colors duration-700 ${navSubtextClass}`}>
                    Connecting Dreams Into Destinations
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
                      <button className={`transition-colors duration-700 text-[10px] xl:text-sm font-semibold uppercase tracking-wide flex items-center gap-1 cursor-pointer ${navTextColor} ${navHoverColor}`}>
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
                                  {sub.links.map((link) => {
                                    const isObject = typeof link === "object" && link !== null;
                                    const title = isObject ? link.title : link;
                                    if (isObject) {
                                      return (
                                        <div key={title} className="relative group/subsub">
                                          <Link
                                            to={toSlug(title)}
                                            className="px-5 py-2.5 hover:bg-orange-50/50 hover:text-[#1D503A] flex items-center justify-between text-sm text-gray-600 transition-colors"
                                          >
                                            {title}
                                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover/subsub:text-[#1D503A]" />
                                          </Link>

                                          <div className="absolute top-0 left-full -ml-1 w-60 bg-white border border-gray-100 shadow-xl rounded-xl opacity-0 invisible group-hover/subsub:opacity-100 group-hover/subsub:visible transition-all duration-300 py-2">
                                            {link.links.map((subLink) => (
                                              <Link
                                                key={subLink}
                                                to={toSlug(subLink)}
                                                className="block px-5 py-2.5 hover:bg-orange-50/50 hover:text-[#1D503A] text-sm text-gray-600 transition-colors"
                                              >
                                                {subLink}
                                              </Link>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return (
                                      <Link
                                        key={title}
                                        to={toSlug(title)}
                                        className="block px-5 py-2.5 hover:bg-orange-50/50 hover:text-[#1D503A] text-sm text-gray-600 transition-colors"
                                      >
                                        {title}
                                      </Link>
                                    );
                                  })}
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
                      className={`transition-colors duration-700 text-[10px] xl:text-sm font-semibold uppercase tracking-wide flex items-center gap-1 ${navTextColor} ${navHoverColor}`}
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
                  className={`h-9 border px-6 rounded-full font-semibold text-sm flex items-center justify-center transition-all duration-700 ${btnLoginClass}`}
                >
                  Login
                </Link>
              ) : (
                <Link
                  to={isAdmin ? "/admin" : "/portal"}
                  className={`h-9 border px-6 rounded-full font-semibold text-sm flex items-center justify-center transition-all duration-700 ${btnLoginClass}`}
                >
                  {isAdmin ? "Admin Portal" : "Dashboard"}
                </Link>
              )}

              <Link
                to="/contact"
                className="group relative flex items-center gap-2 h-9 bg-[#1D503A] border border-[#1D503A] text-white px-3 rounded-full font-semibold text-sm hover:bg-[#0e4a1e] transition-all duration-300 overflow-hidden shadow-md"
              >
                <Phone className="h-4 w-4" />
                <span>Enquire Now</span>
              </Link>

              {/* Profile Avatar / user monogram */}
              {user && (
                <Link
                  to={isAdmin ? "/admin" : "/portal"}
                  className="h-11 w-11 rounded-full border border-gray-200 shadow-sm bg-orange-50 flex items-center justify-center font-bold text-xs text-[#1D503A] hover:bg-orange-100/50 transition-colors shrink-0"
                  title={`${isAdmin ? "Admin Portal" : "User Portal"}: ${userName}`}
                >
                  {userMonogram}
                </Link>
              )}
            </div>

            {/* Mobile Hamburg Trigger */}
            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-full transition-colors duration-700 ${hamburgerClass}`}
                title="Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

          </div>
        </header>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && !isPortal && (
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
                                  onClick={() => {
                                    setMobileSubExpanded(
                                      mobileSubExpanded === sub.title ? null : sub.title
                                    );
                                    setMobileSubSubExpanded(null);
                                  }}
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
                                    {sub.links.map((link) => {
                                      const isObject = typeof link === "object" && link !== null;
                                      const title = isObject ? link.title : link;
                                      if (isObject) {
                                        return (
                                          <div key={title} className="w-full">
                                            <button
                                              onClick={() =>
                                                setMobileSubSubExpanded(
                                                  mobileSubSubExpanded === title ? null : title
                                                )
                                              }
                                              className="w-full py-2 flex items-center justify-between text-[13px] font-semibold text-gray-700 hover:text-[#1D503A]"
                                            >
                                              <span>{title}</span>
                                              <ChevronDown
                                                className={`w-3 h-3 transition-transform ${mobileSubSubExpanded === title ? "rotate-180" : ""
                                                  }`}
                                              />
                                            </button>

                                            {mobileSubSubExpanded === title && (
                                              <div className="pl-4 pr-4 py-1 flex flex-col gap-1 border-l border-orange-100 ml-2">
                                                {link.links.map((subLink) => (
                                                  <Link
                                                    key={subLink}
                                                    to={toSlug(subLink)}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className="py-1.5 text-[12px] text-gray-600 hover:text-[#1D503A] block"
                                                  >
                                                    {subLink}
                                                  </Link>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }
                                      return (
                                        <Link
                                          key={title}
                                          to={toSlug(title)}
                                          onClick={() => setMobileMenuOpen(false)}
                                          className="py-2 text-[13px] text-gray-600 hover:text-[#1D503A] block"
                                        >
                                          {title}
                                        </Link>
                                      );
                                    })}
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
                  to={isAdmin ? "/admin" : "/portal"}
                  className="border border-gray-300 text-gray-800 py-3 rounded-full text-center font-semibold text-sm hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {isAdmin ? "Admin Portal" : "Dashboard"}
                </Link>
              )}

              <Link
                to="/contact"
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
      <main className={isPortal ? "flex-grow" : `flex-grow pb-24 md:pb-8 ${user ? "pt-24" : "pt-16"}`}>
        <Outlet />
      </main>

      {/* Footer matching figma style colorings */}
      {!isPortal && (
        <footer ref={footerRef} className="relative z-10 bg-primary-container text-on-primary-container pt-12 pb-16">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">

            {/* Brand Col */}
            <div className="flex flex-col gap-4">
              <Link to="/" className="flex items-center gap-2 text-white">
                <MapPin className="h-6 w-6 text-white stroke-[2.5]" />
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
              <h3 className="text-white font-headline-md text-body-lg font-semibold">
                Services
              </h3>

              <ul className="flex flex-col gap-3 text-body-sm">
                <li>
                  <Link to="/visa-services" className="text-on-primary-container/80 hover:text-[#D4AF37] transition-colors">
                    Visa Services
                  </Link>
                </li>
                <li>
                  <Link to="/packages" className="text-on-primary-container/80 hover:text-[#D4AF37] transition-colors">
                    Tour Packages
                  </Link>
                </li>
                <li>
                  <Link to="/destinations" className="text-on-primary-container/80 hover:text-[#D4AF37] transition-colors">
                    Destinations
                  </Link>
                </li>
                <li>
                  <Link to="/resources" className="text-on-primary-container/80 hover:text-[#D4AF37] transition-colors">
                    Documentation Guide
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="flex flex-col gap-4">
              <h3 className="text-white font-headline-md text-body-lg font-semibold">
                Company
              </h3>

              <ul className="flex flex-col gap-3 text-body-sm">
                <li>
                  <Link to="/track" className="text-on-primary-container/80 hover:text-[#D4AF37] transition-colors">
                    Track Application
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-on-primary-container/80 hover:text-[#D4AF37] transition-colors">
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-on-primary-container/80 hover:text-[#D4AF37] transition-colors">
                    Staff Login
                  </Link>
                </li>
                <li>
                  <Link to="/portal/login" className="text-on-primary-container/80 hover:text-[#D4AF37] transition-colors">
                    Client Portal
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="flex flex-col gap-4">
              <h3 className="text-white font-headline-md text-body-lg font-semibold">
                Newsletter
              </h3>

              <p className="text-body-sm leading-relaxed text-on-primary-container/80">
                Subscribe to get visa updates and offers.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="flex gap-2 items-center">
                <input
                  type="email"
                  required
                  className="flex-grow px-4 py-2.5 bg-white text-gray-800 placeholder:text-gray-400 text-body-sm rounded-lg border border-transparent focus:outline-none shadow-sm"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <button
                  type="submit"
                  className="bg-[#1D503A] text-white p-3 rounded-lg hover:bg-[#143d2c] transition-all flex items-center justify-center shrink-0"
                  aria-label="Subscribe"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-body-sm text-on-primary-container/60">

            <p>© {new Date().getFullYear()} Eshaare Tours UAE. All rights reserved.</p>

            <div className="flex gap-6 mt-4 md:mt-0 flex-wrap justify-center md:justify-end">
              <a href="https://www.instagram.com/eshaare_tours/?utm_source=qr&r=nametag" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors">
                <InstagramIcon className="w-4 h-4" /> Instagram
              </a>

              <a href="https://wa.me/971557338429" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors">
                <WhatsappIcon className="w-4 h-4" /> WhatsApp
              </a>

              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors">
                <FacebookIcon className="w-4 h-4" /> Facebook
              </a>

              <a href="https://www.linkedin.com/in/eshaare-tours" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors">
                <LinkedinIcon className="w-4 h-4" /> LinkedIn
              </a>

              <a href="https://t.me/eshaaretours" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors">
                <TelegramIcon className="w-4 h-4" /> Telegram
              </a>
            </div>
          </div>
        </footer>
      )}

      {/* WhatsApp FAB with Fox Mascot & Auto-fading Speech Bubble */}
      {!isPortal && (
        <div className={`fixed right-8 z-[100] flex items-center transition-all duration-300 ${footerInView ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0 bottom-8'}`}>
          {/* Fading Speech Bubble */}
          <div
            className={`mr-3.5 bg-white text-gray-800 text-xs font-semibold py-3 px-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 relative transition-all duration-500 ease-out transform origin-right whitespace-nowrap
              ${showTooltip ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-4 scale-90 pointer-events-none"}`}
          >
            Hey, how can I help you? 24/7 service
            {/* Little tail pointing to the button */}
            <div className="absolute top-1/2 -translate-y-1/2 left-full w-0 h-0 border-y-[6px] border-y-transparent border-l-[8px] border-l-white drop-shadow-[2px_0_1px_rgba(0,0,0,0.02)]" />
          </div>

          {/* Fox Button */}
          <a
            href="https://wa.me/971557338429"
            target="_blank"
            rel="noopener noreferrer"
            className="w-16 h-16 bg-white border border-[#1D503A]/15 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:scale-110 transition-transform duration-300 relative group-btn"
            title="Chat with Eshaare Support"
          >
            <img
              src={foxLogo}
              alt="Eshaare Support"
              width="48"
              height="48"
              className="w-12 h-12 object-contain"
            />
            {/* Pulsing online badge */}
            <div className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>
          </a>
        </div>
      )}

      {/* FIGMA DESIGN FIXED BOTTOM NAVBAR */}
      {!isPortal && (
        <div className={`fixed left-1/2 z-[9999] w-[75%] max-w-2xl -translate-x-1/2 rounded-full border border-white/10 bg-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.15)] backdrop-blur-xl transition-all duration-300 ${(footerInView || (!pastHero && location.pathname === '/')) ? 'opacity-0 translate-y-20 pointer-events-none bottom-1' : 'opacity-100 translate-y-0 bottom-1'}`}>
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

            {/* SEARCH (SIRI-STYLE GLOWING ORB) */}
            <button
              onClick={() => setOpenSearch(true)}
              className="-mt-8 mx-auto relative siri-orb-float flex h-14 w-14 items-center justify-center rounded-full
                bg-black overflow-hidden shadow-[0_0_25px_rgba(34,211,238,0.3)] border border-white/20
                transition-all duration-300 hover:scale-110 hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] active:scale-95 group-btn"
            >
              {/* Morphing colored background blobs */}
              <div className="absolute inset-0 z-0 scale-110 opacity-70">
                {/* Cyan blob */}
                <div
                  className="absolute w-[110%] h-[110%] -top-[5%] -left-[5%] bg-gradient-to-br from-cyan-400 to-blue-500 blur-[8px]"
                  style={{
                    animation: "orb-morph-1 8s infinite linear",
                  }}
                />
                {/* Pink/Magenta blob */}
                <div
                  className="absolute w-[120%] h-[120%] -bottom-[10%] -right-[10%] bg-gradient-to-tr from-pink-500 to-rose-500 blur-[10px]"
                  style={{
                    animation: "orb-morph-2 10s infinite linear",
                  }}
                />
                {/* Green/Yellow blob */}
                <div
                  className="absolute w-[90%] h-[90%] top-[10%] left-[10%] bg-gradient-to-r from-emerald-400 to-teal-500 blur-[8px]"
                  style={{
                    animation: "orb-morph-3 12s infinite ease-in-out",
                  }}
                />
              </div>

              {/* Glowing White Core */}
              <div className="absolute w-6 h-6 rounded-full bg-white blur-[4px] opacity-80 z-10 animate-pulse" />

              {/* Search Icon and Text */}
              <div className="relative z-20 flex flex-col items-center justify-center text-white select-none pointer-events-none">
                <Search size={16} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
                <span className="mt-0.5 text-[8px] font-extrabold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                  Search
                </span>
              </div>
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
              to={user ? (isAdmin ? "/admin" : "/portal") : "/portal/login"}
              className="flex flex-col items-center justify-center gap-1 text-xs text-gray-700 transition hover:text-[#1D503A]"
            >
              <User size={17} />
              <span>{isAdmin ? "Admin" : "Account"}</span>
            </Link>

          </div>
        </div>
      )}

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

